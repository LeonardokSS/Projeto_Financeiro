const dateToday = new Date()

const hora = dateToday.getHours()

;

if (hora >= 0 && hora < 12) {
  Saudacao.innerText = "Olá, Bom dia!";
} else if (hora >= 12 && hora < 19) {
  Saudacao.innerText = "Olá, Boa tarde!";
} else {
  Saudacao.innerText = "Olá, Boa noite!";
}
