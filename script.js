const express = require('express');
const app = express();
const port = 3000;


app.use(express.json());


app.get('/',(req,res) => {
    res.send('Ola Mundo!')
    const salario = document.getElementById("salario")
    const gastosFixos = document.getElementById("gastosF")
    const gastosNFixos = document.getElementById("gastosN")


    
})



app.listen(port,()=>{
    console.log(`Servidor rodando em: http://localhost:${port}`)
})

