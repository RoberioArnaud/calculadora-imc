const formulario = document.querySelector('form');
const campoPeso = document.getElementById('peso');
const campoAltura = document.getElementById('altura');
const resultado = document.getElementById('resultado');

formulario.addEventListener('submit', function (evento) {
  evento.preventDefault();

  const peso = Number(campoPeso.value);
  const altura = Number(campoAltura.value);
  const imc = peso / (altura * altura);

  resultado.textContent = `Seu IMC é ${imc.toFixed(2)}.`;
});
