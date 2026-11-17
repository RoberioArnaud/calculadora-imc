const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');

const codigo = readFileSync(join(__dirname, '..', 'script.js'), 'utf8');

// Simula apenas os elementos usados pelo script, sem dependências externas.
function criarCalculadora() {
  let aoEnviar;
  let campoEmFoco;
  const campos = {
    peso: { value: '', focus() { campoEmFoco = 'peso'; } },
    altura: { value: '', focus() { campoEmFoco = 'altura'; } },
    resultado: { textContent: '' }
  };
  const formulario = {
    addEventListener(evento, callback) {
      assert.equal(evento, 'submit');
      aoEnviar = callback;
    }
  };

  runInNewContext(codigo, {
    document: {
      querySelector: () => formulario,
      getElementById: (id) => campos[id]
    }
  });

  return {
    enviar(peso, altura) {
      campos.peso.value = peso;
      campos.altura.value = altura;
      campoEmFoco = undefined;
      let envioImpedido = false;
      aoEnviar({ preventDefault() { envioImpedido = true; } });
      assert.equal(envioImpedido, true);
      return { texto: campos.resultado.textContent, foco: campoEmFoco };
    }
  };
}

test('calcula o IMC e apresenta duas casas decimais', () => {
  const calculadora = criarCalculadora();
  assert.equal(calculadora.enviar('70', '1.75').texto,
    'Seu IMC é 22.86. Classificação: Peso normal.');
  assert.equal(calculadora.enviar('80', '2').texto,
    'Seu IMC é 20.00. Classificação: Peso normal.');
});

const faixas = [
  [18.49, 'Abaixo do peso'],
  [18.5, 'Peso normal'],
  [24.99, 'Peso normal'],
  [25, 'Sobrepeso'],
  [29.99, 'Sobrepeso'],
  [30, 'Obesidade grau I'],
  [34.99, 'Obesidade grau I'],
  [35, 'Obesidade grau II'],
  [39.99, 'Obesidade grau II'],
  [40, 'Obesidade grau III']
];

for (const [imc, classificacao] of faixas) {
  test(`classifica IMC ${imc} como ${classificacao}`, () => {
    const calculadora = criarCalculadora();
    const resultado = calculadora.enviar(String(imc * 4), '2');
    assert.equal(resultado.texto,
      `Seu IMC é ${imc.toFixed(2)}. Classificação: ${classificacao}.`);
  });
}

for (const campo of ['peso', 'altura']) {
  for (const [descricao, valor] of [
    ['vazio', ''], ['zero', '0'], ['negativo', '-1'],
    ['não numérico', 'abc'], ['infinito', 'Infinity']
  ]) {
    test(`rejeita ${campo} ${descricao} e substitui o resultado anterior`, () => {
      const calculadora = criarCalculadora();
      calculadora.enviar('70', '1.75');
      const resultado = calculadora.enviar(
        campo === 'peso' ? valor : '70',
        campo === 'altura' ? valor : '1.75'
      );
      assert.equal(resultado.texto, campo === 'peso'
        ? 'Informe um peso maior que zero.'
        : 'Informe uma altura maior que zero.');
      assert.equal(resultado.foco, campo);
      assert.equal(calculadora.enviar('70', '1.75').texto,
        'Seu IMC é 22.86. Classificação: Peso normal.');
    });
  }
}
