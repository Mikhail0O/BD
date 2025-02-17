const express = require('express');
const sql = require('mssql');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

const config = {
    user: 'qwerty',
    password: 'miha2213060',
    server: 'localhost',
    database: 'EquipmentDB',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

const styles = `
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid black; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        button { padding: 5px 10px; margin: 2px; cursor: pointer; border: none; }
        .edit { background-color: #f39c12; color: white; }
        .delete { background-color: #e74c3c; color: white; }
        .add { background-color: #2ecc71; color: white; padding: 10px; font-size: 16px; }
    </style>
`;

app.get('/', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request().query('SELECT * FROM Equipment');

        let html = `${styles}
                    <h2>Список оборудования</h2>
                    <button class="add" onclick="window.open('/add', '_blank', 'width=400,height=500')">Добавить оборудование</button>
                    <table>
                        <tr>
                            <th>ID</th><th>Название</th><th>Количество</th>
                            <th>На складе</th><th>Описание</th><th>Состояние</th>
                            <th>Действия</th>
                        </tr>`;

        result.recordset.forEach(row => {
            html += `<tr>
                        <td>${row.EquipmentID}</td>
                        <td>${row.Name}</td>
                        <td>${row.Quantity}</td>
                        <td>${row.InStock ? 'Да' : 'Нет'}</td>
                        <td>${row.Description}</td>
                        <td>${row.Condition}</td>
                        <td>
                            <button class="edit" onclick="window.open('/edit/${row.EquipmentID}', '_blank', 'width=400,height=500')">Редактировать</button>
                            <button class="delete" onclick="if(confirm('Удалить запись?')) window.location='/delete/${row.EquipmentID}'">Удалить</button>
                        </td>
                     </tr>`;
        });

        html += `</table>`;
        res.send(html);
    } catch (err) {
        res.status(500).send('Ошибка: ' + err.message);
    }
});

app.get('/add', (req, res) => {
    res.send(`${styles}
              <h2>Добавить оборудование</h2>
              <form action="/add" method="post">
                  <label>Название: <input type="text" name="name" required></label><br>
                  <label>Количество: <input type="number" name="quantity" required></label><br>
                  <label>На складе: <input type="checkbox" name="inStock"></label><br>
                  <label>Описание: <input type="text" name="description"></label><br>
                  <label>Состояние:
                      <select name="condition">
                          <option value="Работоспособное">Работоспособное</option>
                          <option value="Нуждается в ремонте">Нуждается в ремонте</option>
                          <option value="Списанное">Списанное</option>
                      </select>
                  </label><br>
                  <button class="add" type="submit">Добавить</button>
              </form>`);
});

app.post('/add', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('name', sql.NVarChar, req.body.name)
            .input('quantity', sql.Int, req.body.quantity)
            .input('inStock', sql.Bit, req.body.inStock ? 1 : 0)
            .input('description', sql.NVarChar, req.body.description)
            .input('condition', sql.NVarChar, req.body.condition)
            .query('INSERT INTO Equipment (Name, Quantity, InStock, Description, Condition) VALUES (@name, @quantity, @inStock, @description, @condition)');
        
        res.send('<script>window.opener.location.reload(); window.close();</script>');
    } catch (err) {
        res.status(500).send('Ошибка добавления: ' + err.message);
    }
});

app.get('/edit/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM Equipment WHERE EquipmentID = @id');

        if (result.recordset.length === 0) {
            return res.status(404).send('Оборудование не найдено');
        }

        const item = result.recordset[0];
        const checked = item.InStock ? 'checked' : '';

        let html = `${styles}
                    <h2>Редактировать оборудование</h2>
                    <form action="/update/${item.EquipmentID}" method="post">
                        <label>Название: <input type="text" name="name" value="${item.Name}" required></label><br>
                        <label>Количество: <input type="number" name="quantity" value="${item.Quantity}" required></label><br>
                        <label>На складе: <input type="checkbox" name="inStock" ${checked}></label><br>
                        <label>Описание: <input type="text" name="description" value="${item.Description}"></label><br>
                        <label>Состояние:
                            <select name="condition">
                                <option value="Работоспособное" ${item.Condition === 'Работоспособное' ? 'selected' : ''}>Работоспособное</option>
                                <option value="Нуждается в ремонте" ${item.Condition === 'Нуждается в ремонте' ? 'selected' : ''}>Нуждается в ремонте</option>
                                <option value="Списанное" ${item.Condition === 'Списанное' ? 'selected' : ''}>Списанное</option>
                            </select>
                        </label><br>
                        <button class="edit" type="submit">Сохранить</button>
                    </form>`;

        res.send(html);
    } catch (err) {
        res.status(500).send('Ошибка загрузки формы редактирования: ' + err.message);
    }
});

app.post('/update/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('name', sql.NVarChar, req.body.name)
            .input('quantity', sql.Int, req.body.quantity)
            .input('inStock', sql.Bit, req.body.inStock ? 1 : 0)
            .input('description', sql.NVarChar, req.body.description)
            .input('condition', sql.NVarChar, req.body.condition)
            .query('UPDATE Equipment SET Name=@name, Quantity=@quantity, InStock=@inStock, Description=@description, Condition=@condition WHERE EquipmentID=@id');

        res.send('<script>window.opener.location.reload(); window.close();</script>');
    } catch (err) {
        res.status(500).send('Ошибка обновления: ' + err.message);
    }
});
app.get('/delete/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Equipment WHERE EquipmentID = @id');

        res.redirect('/');
    } catch (err) {
        res.status(500).send('Ошибка удаления: ' + err.message);
    }
});


app.listen(port, () => {
    console.log(`Сервер работает на http://localhost:${port}`);
});
