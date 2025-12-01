const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

app.use(express.static(__dirname)); 
app.use(express.json());

// Função para ler o arquivo JSON
function lerJSON() {
    return JSON.parse(fs.readFileSync("Dados.json", "utf-8"));
}

// Função para salvar no JSON
function salvarJSON(dados) {
    fs.writeFileSync("Dados.json", JSON.stringify(dados, null, 2), "utf-8");
}

// Rota para exibir a página de lista
app.get("/ver-gastos", (req, res) => {
    res.sendFile(path.join(__dirname, "ver_gastos.html"));
});

// Rota para listar gastos
app.get("/listar-gastos", (req, res) => {
    const gastos = lerJSON();
    res.json({ gastos });
});

app.get('/grafico-dados', (req, res) => {
    try {
        const dados = JSON.parse(fs.readFileSync("Dados.json", "utf-8"));
        res.json(dados);
    } catch (e) {
        res.status(500).json({ erro: "Falha ao ler o arquivo" });
    }
});


app.get('/grafico', (req, res) => {
    res.sendFile(path.join(__dirname, 'grafico.html'));
});


// Rota para adicionar gasto (vem do form salvar-gasto.html)
app.get(`/salvar-gasto`,(req,res)=>{
    res.sendFile(path.join(__dirname,`salvar_gasto.html`))
})

app.post('/salvar-gasto', (req, res) => {
    const gasto = req.body;

    // Lê o arquivo
    const atual = JSON.parse(fs.readFileSync("Dados.json", "utf-8"));

    // Gera um ID novo automaticamente
    const novoId = atual.length > 0
        ? Math.max(...atual.map(g => g.id)) + 1
        : 1;

    const novoGasto = {
        id: novoId,
        categoria: gasto.categoria,
        valor: gasto.valor
    };

    // Adiciona ao array
    atual.push(novoGasto);

    // Salva o arquivo
    fs.writeFileSync("Dados.json", JSON.stringify(atual, null, 2));

    res.json({ mensagem: "Gasto salvo", id: novoId });
});



// Rota para deletar gasto
app.delete("/deletar-gasto/:id", (req, res) => {
    const id = Number(req.params.id);
    let dados = lerJSON();
    const novoArray = dados.filter(g => g.id !== id);

    salvarJSON(novoArray);

    res.json({ mensagem: "Gasto deletado" });
});

// Página principal
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "menu.html"));
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
