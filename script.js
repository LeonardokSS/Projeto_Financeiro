const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();
const port = 3000;
const methodOverride = require('method-override');

// Middleware para processar dados JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(__dirname));

// Configuração da URL de conexão com o MongoDB
const url = 'mongodb://127.0.0.1:27017/';
const dbName = 'financeiro';
const collectionName = 'gastos';
const metasCollectionName = 'metas';

// ==================== ROTAS DE PÁGINAS ====================

// Página inicial
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Página de lista de gastos
app.get('/ver-gastos', (req, res) => {
    res.sendFile(__dirname + '/ver_gastos.html');
});

// Página de gráficos
app.get('/grafico-dados', (req, res) => {
    res.sendFile(__dirname + '/grafico.html');
});

// Página de cadastro de gasto
app.get('/salvar-gasto', (req, res) => {
    res.sendFile(__dirname + '/salvar_gasto.html');
});

// Página de metas financeiras
app.get('/metas', (req, res) => {
    res.sendFile(__dirname + '/metas.html');
});

// ==================== ROTAS DE GASTOS ====================

// Listar gastos
app.get('/listar-gastos', async (req, res) => {
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const gastos = await collection.find({}).sort({ id: -1 }).toArray();
        res.json({ gastos });
    } catch (err) {
        console.error('Erro ao listar gastos:', err);
        res.status(500).send('Erro ao listar gastos. Por favor, tente novamente mais tarde.');
    } finally {
        client.close();
    }
});

// Obter dados para os gráficos
app.post('/grafico-dados', async (req, res) => {
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const dados = await collection.find({}).toArray();
        res.json(dados);
    } catch (err) {
        console.error('Erro ao buscar dados:', err);
        res.status(500).json({ erro: 'Falha ao ler os dados' });
    } finally {
        client.close();
    }
});

// Salvar um novo gasto
app.post('/salvar-gasto', async (req, res) => {
    const novoGasto = req.body;
    
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        // Buscar o último ID e incrementar
        const ultimoGasto = await collection.findOne({}, { sort: { id: -1 } });
        const novoId = ultimoGasto ? ultimoGasto.id + 1 : 1;
        
        // Adicionar ID ao novo gasto
        novoGasto.id = novoId;
        novoGasto.valor = parseFloat(novoGasto.valor);
        novoGasto.data = new Date();
        
        // Inserir o novo gasto no banco de dados
        const result = await collection.insertOne(novoGasto);
        console.log(`Gasto cadastrado com sucesso. ID: ${result.insertedId}`);
        
        // Verificar se é requisição AJAX ou formulário tradicional
        if (req.headers['content-type'] === 'application/json' || req.xhr) {
            res.json({ 
                mensagem: 'Gasto salvo com sucesso', 
                id: novoId,
                gasto: novoGasto 
            });
        } else {
            res.redirect('/');
        }
    } catch (err) {
        console.error('Erro ao cadastrar o gasto:', err);
        
        if (req.headers['content-type'] === 'application/json' || req.xhr) {
            res.status(500).json({ erro: 'Erro ao cadastrar o gasto' });
        } else {
            res.status(500).send('Erro ao cadastrar o gasto. Por favor, tente novamente mais tarde.');
        }
    } finally {
        client.close();
    }
});

// Deletar um gasto
app.delete('/deletar-gasto/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const result = await collection.deleteOne({ id: id });
        
        if (result.deletedCount > 0) {
            console.log(`Gasto com ID: ${id} deletado com sucesso.`);
            res.json({ mensagem: 'Gasto deletado com sucesso' });
        } else {
            res.status(404).json({ erro: 'Gasto não encontrado' });
        }
    } catch (err) {
        console.error('Erro ao deletar o gasto:', err);
        res.status(500).json({ erro: 'Erro ao deletar o gasto. Por favor, tente novamente mais tarde.' });
    } finally {
        client.close();
    }
});

// Atualizar um gasto
app.put('/atualizar-gasto/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { categoria, valor } = req.body;
    
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const result = await collection.updateOne(
            { id: id },
            { 
                $set: { 
                    categoria: categoria,
                    valor: parseFloat(valor),
                    dataAtualizacao: new Date()
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`Gasto com ID: ${id} atualizado com sucesso.`);
            res.redirect('/');
        } else {
            res.status(404).send('Gasto não encontrado.');
        }
    } catch (err) {
        console.error('Erro ao atualizar o gasto:', err);
        res.status(500).send('Erro ao atualizar o gasto. Por favor, tente novamente mais tarde.');
    } finally {
        client.close();
    }
});

// Buscar gastos por categoria
app.get('/gastos-por-categoria/:categoria', async (req, res) => {
    const { categoria } = req.params;
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const gastos = await collection.find({ categoria: categoria }).toArray();
        res.json({ gastos, total: gastos.length });
    } catch (err) {
        console.error('Erro ao buscar por categoria:', err);
        res.status(500).json({ erro: 'Erro ao buscar gastos' });
    } finally {
        client.close();
    }
});

// Estatísticas
app.get('/estatisticas', async (req, res) => {
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName);
        
        const totalGastos = await collection.countDocuments();
        const gastos = await collection.find({}).toArray();
        
        const valorTotal = gastos.reduce((acc, gasto) => acc + parseFloat(gasto.valor), 0);
        const media = totalGastos > 0 ? valorTotal / totalGastos : 0;
        
        // Agrupa por categoria
        const porCategoria = await collection.aggregate([
            {
                $group: {
                    _id: "$categoria",
                    total: { $sum: "$valor" },
                    quantidade: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]).toArray();
        
        res.json({
            totalGastos,
            valorTotal: valorTotal.toFixed(2),
            media: media.toFixed(2),
            porCategoria
        });
    } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
    } finally {
        client.close();
    }
});

// ==================== ROTAS DE METAS ====================

// Listar metas

app.get('/metas', (req, res) => {
    res.sendFile(__dirname + '/metas.html');
});


app.get('/listar-metas', async (req, res) => {
 
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(metasCollectionName);

        const metas = await collection.find({}).sort({ id: -1 }).toArray();
        return res.json({ metas });

    } catch (err) {
        console.error('Erro ao listar metas:', err);
        return res.status(500).json({ erro: 'Erro ao listar metas' });

    } finally {
        client.close();
    }
});


// Salvar uma nova meta
app.post('/salvar-meta', async (req, res) => {
    const novaMeta = req.body;
    
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(metasCollectionName);
        
        // Buscar o último ID e incrementar
        const ultimaMeta = await collection.findOne({}, { sort: { id: -1 } });
        const novoId = ultimaMeta ? ultimaMeta.id + 1 : 1;
        
        // Adicionar ID à nova meta
        novaMeta.id = novoId;
        novaMeta.valorAlvo = parseFloat(novaMeta.valorAlvo);
        novaMeta.valorAtual = parseFloat(novaMeta.valorAtual) || 0;
        novaMeta.dataCriacao = new Date();
        
        // Inserir a nova meta no banco de dados
        const result = await collection.insertOne(novaMeta);
        console.log(`Meta cadastrada com sucesso. ID: ${result.insertedId}`);
        
        res.json({ 
            mensagem: 'Meta salva com sucesso', 
            id: novoId,
            meta: novaMeta 
        });
    } catch (err) {
        console.error('Erro ao cadastrar a meta:', err);
        res.status(500).json({ erro: 'Erro ao cadastrar a meta' });
    } finally {
        client.close();
    }
});

// Atualizar uma meta
app.put('/atualizar-meta/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, valorAlvo, valorAtual, categoria, dataLimite } = req.body;
    
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(metasCollectionName);
        
        const result = await collection.updateOne(
            { id: id },
            { 
                $set: { 
                    nome: nome,
                    valorAlvo: parseFloat(valorAlvo),
                    valorAtual: parseFloat(valorAtual),
                    categoria: categoria,
                    dataLimite: dataLimite,
                    dataAtualizacao: new Date()
                } 
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`Meta com ID: ${id} atualizada com sucesso.`);
            res.json({ mensagem: 'Meta atualizada com sucesso' });
        } else {
            res.status(404).json({ erro: 'Meta não encontrada' });
        }
    } catch (err) {
        console.error('Erro ao atualizar a meta:', err);
        res.status(500).json({ erro: 'Erro ao atualizar a meta' });
    } finally {
        client.close();
    }
});

// Deletar uma meta
app.delete('/deletar-meta/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    
    const client = new MongoClient(url);
    
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(metasCollectionName);
        
        const result = await collection.deleteOne({ id: id });
        
        if (result.deletedCount > 0) {
            console.log(`Meta com ID: ${id} deletada com sucesso.`);
            res.json({ mensagem: 'Meta deletada com sucesso' });
        } else {
            res.status(404).json({ erro: 'Meta não encontrada' });
        }
    } catch (err) {
        console.error('Erro ao deletar a meta:', err);
        res.status(500).json({ erro: 'Erro ao deletar a meta' });
    } finally {
        client.close();
    }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
});