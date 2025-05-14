// Este código es solo para ilustrar el funcionamiento del árbol de decisión

// Emails representados como vectores one-hot (cada fila = un email)
const emails = [
  [1, 0, 1, 0, 0, 0, 0, 1], // Spam
  [0, 1, 0, 1, 0, 0, 0, 0], // Ham
  [1, 0, 1, 0, 1, 0, 0, 0], // Spam
  [0, 1, 0, 1, 0, 1, 0, 0], // Ham
];

// Etiquetas reales de los emails
const etiquetas = ["Spam", "Ham", "Spam", "Ham"];

// Entrenamos el árbol de decisión
const arbol = entrenarModelo(emails, etiquetas);

// Email nuevo en texto
const textoNuevo = "aprovechá esta oferta gratis hoy";

// Vocabulario base (índice = posición en vector one-hot)
const vocabulario = [
  "gratis",
  "oferta",
  "compra",
  "reunión",
  "hoy",
  "cliente",
  "urgente",
  "promoción",
];

// Convertimos el texto a tokens (simplificado)
const tokens = textoNuevo
  .toLowerCase()
  .split(" ")
  .filter((pal) => vocabulario.includes(pal));

// Vector one-hot para el email nuevo
const vector = vocabulario.map((token) => (tokens.includes(token) ? 1 : 0));

// Clasificamos el email
const resultado = predecir(arbol, vector);

console.log("Clasificación:", resultado); // Ejemplo: "Spam"
