const assert = require('node:assert/strict');
const {test} = require('node:test');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const vm = require('node:vm');

class Input {}
Object.defineProperty(Input.prototype, 'value', {get() {}, set() {}});
const context = {
    window: {}, HTMLInputElement: Input,
    document: {querySelectorAll: () => [], body: {}},
    MutationObserver: class {observe() {}},
};
vm.runInNewContext(readFileSync(join(__dirname, '../static/js/utils/fechas.js'), 'utf8'), context);
const fechas = context.window.ArayaFechas;

test('muestra ISO y fechas históricas con dd-mm-AAAA', () => {
    for (const value of ['2026-11-10', '2026-11-10T03:00:00Z', '10/11/2026', '10-11-2026']) {
        assert.equal(fechas.mostrar(value), '10-11-2026');
    }
    assert.equal(fechas.mostrar(null), '');
    assert.equal(fechas.mostrar(''), '');
});

test('valida días reales sin convertirlos a otro mes', () => {
    assert.equal(fechas.iso('29-02-2024'), '2024-02-29');
    for (const value of ['29-02-2026', '31-02-2026', '31-04-2026', '00-11-2026', '10-13-2026']) {
        assert.equal(fechas.iso(value), '');
    }
});

test('mantiene ISO para envío y no interpreta fechas ambiguas de EEUU', () => {
    assert.equal(fechas.iso('02-01-2026'), '2026-01-02');
    assert.equal(fechas.iso('2026-01-02'), '2026-01-02');
    assert.equal(fechas.iso('11/30/2026'), '');
    assert.equal(fechas.mostrar('BP4X4X2.4'), 'BP4X4X2.4');
});
