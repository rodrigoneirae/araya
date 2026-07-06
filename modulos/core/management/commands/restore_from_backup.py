from django.core.management.base import BaseCommand
from django.apps import apps
from django.contrib.auth import get_user_model
from django.db import connection, connections, ProgrammingError
from django.db import models as dj_models

BACKUP_DB = 'backup'
PROJECT_APPS = {'core', 'maestros', 'inventario', 'registros', 'produccion'}

_lower_map_cache = {}
_placeholder_created = set()


def get_ordered_models():
    all_models = []
    for m in apps.get_models():
        if m._meta.app_label not in PROJECT_APPS:
            continue
        if not m._meta.managed:
            continue
        all_models.append(m)

    graph = {m: set() for m in all_models}
    for m in all_models:
        for field in m._meta.get_fields():
            if not isinstance(field, dj_models.Field):
                continue
            if not (field.many_to_one or field.one_to_one):
                continue
            if not field.related_model or field.related_model == m:
                continue
            related = field.related_model
            if related in graph:
                graph[m].add(related)

    sorted_models = []
    visited = set()

    def visit(m):
        if m in visited:
            return
        visited.add(m)
        for dep in graph.get(m, set()):
            visit(dep)
        sorted_models.append(m)

    for m in all_models:
        visit(m)

    return sorted_models


def clear_default_data(all_models):
    with connection.cursor() as cursor:
        for m in reversed(all_models):
            cursor.execute(f'TRUNCATE TABLE "{m._meta.db_table}" CASCADE')
        cursor.execute('TRUNCATE TABLE "core_appconfig" CASCADE')


def normalize_fk_value(fk_value, pk_field):
    if fk_value is None:
        return None
    if isinstance(pk_field, (dj_models.IntegerField, dj_models.SmallIntegerField, dj_models.BigIntegerField)):
        return int(float(fk_value))
    if isinstance(pk_field, (dj_models.FloatField, dj_models.DecimalField)):
        return float(fk_value)
    if isinstance(pk_field, (dj_models.CharField, dj_models.TextField)):
        val = str(fk_value)
        max_len = getattr(pk_field, 'max_length', None)
        if max_len and len(val) > max_len:
            val = val[:max_len]
        return val
    return fk_value


def build_lower_map(parent):
    pk_attname = parent._meta.pk.attname
    key = (parent._meta.db_table, pk_attname)
    if key in _lower_map_cache:
        return _lower_map_cache[key]

    lmap = {}
    for obj in parent.objects.using('default').all().iterator():
        pk_val = getattr(obj, pk_attname)
        if isinstance(pk_val, str):
            lmap[pk_val.lower()] = pk_val
    _lower_map_cache[key] = lmap
    return lmap


def create_placeholder(parent, pk_value):
    pk_attname = parent._meta.pk.attname
    cache_key = (parent._meta.db_table, str(pk_value))
    if cache_key in _placeholder_created:
        return
    _placeholder_created.add(cache_key)

    kwargs = {pk_attname: pk_value}
    for pf in parent._meta.get_fields():
        if not isinstance(pf, dj_models.Field):
            continue
        if pf.primary_key:
            continue
        if pf.has_default():
            continue
        if pf.null:
            continue
        if isinstance(pf, (dj_models.CharField, dj_models.TextField)):
            kwargs[pf.name] = f'[ORFANO] {pk_value}'[:pf.max_length] if pf.max_length else f'[ORFANO] {pk_value}'
        elif isinstance(pf, (dj_models.IntegerField, dj_models.SmallIntegerField, dj_models.FloatField)):
            kwargs[pf.name] = 0
        elif isinstance(pf, dj_models.BooleanField):
            kwargs[pf.name] = False

    try:
        parent.objects.using('default').create(**kwargs)
    except Exception:
        pass


def get_backup_columns(model):
    """Obtiene las columnas que realmente existen en la tabla del backup (MSSQL)."""
    with connections[BACKUP_DB].cursor() as cursor:
        cursor.execute(
            f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{model._meta.db_table}'"
        )
        return {row[0] for row in cursor.fetchall()}


def copy_model_data(model, stdout):
    fk_fields = []
    for field in model._meta.get_fields():
        if not isinstance(field, dj_models.Field):
            continue
        if not (field.many_to_one or field.one_to_one):
            continue
        if not field.related_model:
            continue
        fk_fields.append(field)

    for fk in fk_fields:
        parent = fk.related_model
        if parent._meta.app_label not in PROJECT_APPS or not parent._meta.managed:
            continue

        fk_col = fk.db_column or fk.attname
        pk_field = parent._meta.pk
        pk_attname = pk_field.attname

        is_string_fk = isinstance(pk_field, (dj_models.CharField, dj_models.TextField))
        collate_sql = ' COLLATE Latin1_General_BIN' if is_string_fk else ''
        try:
            with connections[BACKUP_DB].cursor() as cursor:
                cursor.execute(f'SELECT DISTINCT "{fk_col}"{collate_sql} FROM {model._meta.db_table}')
                raw_values = [row[0] for row in cursor.fetchall() if row[0] is not None]
        except Exception:
            continue

        fk_values = []
        for v in raw_values:
            v = normalize_fk_value(v, pk_field)
            if v not in fk_values:
                fk_values.append(v)

        existing_pks = set(parent.objects.using('default').filter(
            **{f'{pk_attname}__in': fk_values}
        ).values_list(pk_attname, flat=True))

        existing_lower = {v.lower() for v in existing_pks if isinstance(v, str)}
        existing_nonstr = {v for v in existing_pks if not isinstance(v, str)}

        missing = []
        for v in fk_values:
            if isinstance(v, str):
                if v not in existing_pks and v.lower() not in existing_lower:
                    lower_map = build_lower_map(parent)
                    if lower_map and v.lower() in lower_map:
                        continue
                    missing.append(v)
            else:
                if v not in existing_nonstr:
                    missing.append(v)

        if missing:
            stdout.write(f'    Creando {len(missing)} placeholders en {parent.__name__}\n')
            for v in missing:
                create_placeholder(parent, v)

    # Detectar columnas que existen en el backup vs el modelo Django
    backup_cols = get_backup_columns(model)
    local_fields = {}
    for field in model._meta.local_concrete_fields:
        db_col = field.db_column or field.column
        local_fields[db_col] = field.attname

    cols_to_select = []
    for db_col in local_fields:
        if db_col in backup_cols:
            cols_to_select.append(db_col)
        else:
            stdout.write(f'    Columna omitida: {db_col} (no existe en backup)\n')

    col_sql = ', '.join(f'"{c}"' for c in cols_to_select)
    with connections[BACKUP_DB].cursor() as cursor:
        cursor.execute(f'SELECT {col_sql} FROM {model._meta.db_table}')
        rows = cursor.fetchall()

    backup_objects = []
    for row in rows:
        obj = model()
        for db_col, value in zip(cols_to_select, row):
            attname = local_fields[db_col]
            setattr(obj, attname, value)
        backup_objects.append(obj)

    if not backup_objects:
        return 0

    for obj in backup_objects:
        for fk in fk_fields:
            fk_value = getattr(obj, fk.attname)
            if fk_value is not None:
                pk_field = fk.related_model._meta.pk
                normalized = normalize_fk_value(fk_value, pk_field)
                if isinstance(normalized, str):
                    parent = fk.related_model
                    lower_map = build_lower_map(parent)
                    if lower_map and normalized.lower() in lower_map:
                        corrected = lower_map[normalized.lower()]
                        if corrected != normalized:
                            normalized = corrected
                setattr(obj, fk.attname, normalized)

        obj.save(using='default', force_insert=True)

    return len(backup_objects)


def reset_sequences():
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT c.relname FROM pg_class c
            JOIN pg_depend d ON c.oid = d.objid
            JOIN pg_class t ON d.refobjid = t.oid
            JOIN pg_namespace n ON t.relnamespace = n.oid
            WHERE c.relkind = 'S' AND n.nspname = 'public'
            ORDER BY c.relname
        """)
        for (seq_name,) in cursor.fetchall():
            try:
                cursor.execute(
                    "SELECT setval(%s, COALESCE((SELECT MAX(id) FROM %s), 1))",
                    [seq_name, seq_name.rsplit('_', 2)[0]]
                )
            except Exception:
                pass


class Command(BaseCommand):
    help = 'Restaura datos desde backup (MSSQL) a default (PostgreSQL) si no hay usuarios'

    def handle(self, *args, **options):
        self.stdout.write('Verificando si existen usuarios en default...')

        User = get_user_model()

        try:
            users_exist = User.objects.using('default').exists()
        except ProgrammingError:
            self.stdout.write(self.style.WARNING(
                'La tabla de usuarios no existe. Ejecuta "migrate" primero.'
            ))
            return

        if users_exist:
            self.stdout.write(self.style.WARNING(
                'Ya existen usuarios en default. No se realizó ninguna copia.'
            ))
            return

        self.stdout.write(self.style.WARNING(
            'No se encontraron usuarios. Iniciando restauración desde backup...'
        ))

        models = get_ordered_models()
        self.stdout.write(f'Modelos a copiar ({len(models)}):')
        for m in models:
            self.stdout.write(f'  - {m._meta.app_label}.{m.__name__} ({m._meta.db_table})')

        self.stdout.write('Limpiando datos existentes en default...')
        clear_default_data(models)
        self.stdout.write('Datos eliminados.')

        total = 0
        for model in models:
            try:
                count = copy_model_data(model, self.stdout)
                if count:
                    self.stdout.write(f'  {model.__name__}: {count} registros')
                total += count
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  Error en {model.__name__}: {e}'
                ))

        reset_sequences()
        self.stdout.write('Secuencias reseteadas.')

        self.stdout.write(self.style.SUCCESS(
            f'Restauración completada. {total} registros copiados.'
        ))
