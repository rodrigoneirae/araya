const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

function pantalla() {
    const elementos = new Map();
    const avisos = [];
    const campo = id => {
        if (!elementos.has(id)) elementos.set(id, {
            value: '', innerHTML: '', selectedOptions: [{value: '', text: ''}],
            classList: {add() {}, remove() {}}, focus() {},
        });
        return elementos.get(id);
    };
    const context = vm.createContext({
        document: {currentScript: {dataset: {url: '/inventario/ocat/'}},
            addEventListener() {}, getElementById: campo},
        window: {}, Toastify: options => ({showToast() { avisos.push(options.text); }}),
    });
    vm.runInContext(readFileSync(join(__dirname, '../static/js/modulos/inventario/ocat.js'), 'utf8'), context);
    vm.runInContext(`
        actualizarSelect2 = () => {};
        renderizarDetalleOcat = () => {};
        calcularTotalesOcat = () => {};
        buscarXHROcat = (action, datos, callback) => {
            window.ultimaConsulta = {action, datos};
            callback(action === 'buscar_articulo'
                ? {success: true, data: {precio: 2600, nombre: 'Basas', um: 'UN'}}
                : (window.respuesta || {success: true, cup: 2200}));
        };
    `, context);
    return {
        campo, context, avisos,
        ejecutar: code => vm.runInContext(code, context),
        detalles: () => JSON.parse(vm.runInContext('JSON.stringify(detallesOcat)', context)),
    };
}

test('seleccionar artículo carga precio y agregar previsualiza el CUP antes de insertarlo', () => {
    const p = pantalla();
    p.campo('ocatArtCod').value = 'BASA';
    p.ejecutar('buscarArticuloOcat()');
    assert.equal(p.campo('ocatArtPUnit').value, 2600);
    p.campo('ocatArtCant').value = '50';
    p.ejecutar('agregarArticuloOcat()');
    assert.equal(p.context.window.ultimaConsulta.action, 'calcular_cup');
    assert.equal(p.detalles()[0].cup, 2200);
    assert.equal(p.detalles()[0].total, 130000);
});

test('un error de cálculo no inserta un detalle con CUP cero', () => {
    const p = pantalla();
    p.campo('ocatArtCod').value = 'BASA';
    p.campo('ocatArtCant').value = '50';
    p.campo('ocatArtPUnit').value = '2600';
    p.context.window.respuesta = {success: false, message: 'Error de valoración'};
    p.ejecutar('agregarArticuloOcat()');
    assert.deepEqual(p.detalles(), []);
    assert.equal(p.campo('ocatArtCod').value, 'BASA');
});

test('editar detalle admite CUP manual y lo aplica a las líneas del mismo artículo', () => {
    const p = pantalla();
    p.ejecutar(`detallesOcat = [
        {codigo:'BASA', cantidad:25, punit:2600, cup:2200},
        {codigo:'BASA', cantidad:25, punit:2600, cup:2200}
    ]; abrirModalEditarDetalle(0);`);
    p.campo('editArtCUP').value = '2400';
    p.context.window.respuesta = {success: true, cup: 2400};
    p.ejecutar('guardarEditarDetalle()');
    assert.deepEqual(p.detalles().map(d => d.cup_manual), [2400, 2400]);
    assert.deepEqual(p.detalles().map(d => d.cup), [2400, 2400]);
});

test('el modal CUP acepta ajuste manual y vacío restaura el cálculo automático', () => {
    const p = pantalla();
    p.ejecutar(`detallesOcat = [{codigo:'BASA', cantidad:50, punit:2600, cup:2200}]; abrirModalCUP(0);`);
    p.campo('cupManual').value = '2400';
    p.context.window.respuesta = {success: true, cup: 2400};
    p.ejecutar('guardarCUP()');
    assert.equal(p.detalles()[0].cup_manual, 2400);
    p.ejecutar('abrirModalCUP(0)');
    p.campo('cupManual').value = '';
    p.context.window.respuesta = {success: true, cup: 2200};
    p.ejecutar('guardarCUP()');
    assert.equal(p.detalles()[0].cup_manual, undefined);
    assert.equal(p.detalles()[0].cup, 2200);
});

test('eliminar muestra advertencia y permite quitar la última línea del artículo', () => {
    const p = pantalla();
    p.ejecutar(`detallesOcat = [
        {codigo:'BASA', cantidad:50, punit:10000, cup:2200},
        {codigo:'OTRO', cantidad:5, punit:10, cup:10}
    ];`);
    p.context.window.respuesta = {
        success: true, cup: 2200,
        advertencias: ['La corrección deja una valoración negativa. Se conserva el CUP actual.'],
    };
    p.ejecutar('eliminarArticuloOcat(0)');
    assert.deepEqual(p.detalles().map(d => d.codigo), ['OTRO']);
    assert.match(p.avisos[0], /valoración negativa/);
    assert.equal(JSON.parse(p.context.window.ultimaConsulta.datos.detalles).length, 1);
});

test('eliminar una línea repetida actualiza el CUP sin bloquear por advertencia', () => {
    const p = pantalla();
    p.ejecutar(`detallesOcat = [
        {codigo:'BASA', cantidad:20, punit:10000, cup:2200},
        {codigo:'BASA', cantidad:30, punit:10000, cup:2200}
    ];`);
    p.context.window.respuesta = {success: true, cup: 2200, advertencias: ['Valoración negativa']};
    p.ejecutar('eliminarArticuloOcat(1)');
    assert.equal(p.detalles().length, 1);
    assert.equal(p.detalles()[0].cantidad, 20);
    assert.equal(p.detalles()[0].cup, 2200);
    assert.equal(p.avisos.length, 1);
});
