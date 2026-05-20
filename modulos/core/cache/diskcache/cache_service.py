
from django.core.cache.backends.base import BaseCache
from diskcache import Cache


class DiskCache(BaseCache):
    def __init__(self, location, params):
        super().__init__(params)
        # Extraer opciones del params para pasarlas a Cache
        options = params.get('OPTIONS', {})
        self._cache = Cache(location, **options)

    def add(self, key, value, timeout=None, version=None):
        return self._cache.add(
            self.make_key(key, version=version),
            value,
            expire=self.get_backend_timeout(timeout),
        )

    def get(self, key, default=None, version=None):
        return self._cache.get(
            self.make_key(key, version=version),
            default,
        )

    def set(self, key, value, timeout=None, version=None):
        self._cache.set(
            self.make_key(key, version=version),
            value,
            expire=self.get_backend_timeout(timeout),
        )

    def delete(self, key, version=None):
        return self._cache.delete(self.make_key(key, version=version))

    def clear(self):
        self._cache.clear()

    def has_key(self, key, version=None):
        return self.make_key(key, version=version) in self._cache

    def delete_pattern(self, pattern):
        """Elimina todas las claves que contienen el patrón."""
        keys_to_delete = []
        for key in self._cache.iterkeys():
            if pattern in key:
                keys_to_delete.append(key)
        for key in keys_to_delete:
            self._cache.delete(key)

    def get_backend_timeout(self, timeout=None):
        if timeout is None:
            return self.default_timeout
        return timeout