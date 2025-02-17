const sql = require("mssql");

const config = {
  user: "qwerty",        // Логин
  password: "123",       // Пароль
  server: "localhost",   // Сервер
  port: 1433,            // Порт
  database: "EquipmentDB", // База данных
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function testConnection() {
  try {
    await sql.connect(config);
    console.log("✅ Подключение успешно!");
  } catch (err) {
    console.error("❌ Ошибка подключения:", err.message);
  }
}

testConnection();
