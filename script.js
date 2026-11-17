const formulario = document.querySelector('form');
const campoPeso = document.getElementById('peso');
const campoAltura = document.getElementById('altura');
const resultado = document.getElementById('resultado');

formulario.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const peso = Number(campoPeso.value);
  const altura = Number(campoAltura.value);

  if (!Number.isFinite(peso) || peso <= 0) {
    resultado.textContent = 'Informe um peso maior que zero.';
    campoPeso.focus();
    return;
  }

  if (!Number.isFinite(altura) || altura <= 0) {
    resultado.textContent = 'Informe uma altura maior que zero.';
    campoAltura.focus();
    return;
  }

  const imc = peso / (altura * altura);

  let classificacao;

  if (imc < 18.5) {
    classificacao = 'Abaixo do peso';
  } else if (imc < 25) {
    classificacao = 'Peso normal';
  } else if (imc < 30) {
    classificacao = 'Sobrepeso';
  } else if (imc < 35) {
    classificacao = 'Obesidade grau I';
  } else if (imc < 40) {
    classificacao = 'Obesidade grau II';
  } else {
    classificacao = 'Obesidade grau III';
  }

  resultado.textContent = `Seu IMC é ${imc.toFixed(2)}. Classificação: ${classificacao}.`;
});
