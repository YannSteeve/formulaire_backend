import express from 'express';

import mysql2 from 'mysql2';

const db = mysql2.createConnection({
    host: 'mysql-yannsteeve.alwaysdata.net',
    user: '373412_yann',
    password: 'St17081960',
    database: 'yannsteeve_apprenant_241',
    charset: 'utf8mb4_general_ci'
    
    
});

// Établir la connexion
db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données: ' + err.stack);
        return;
    }
    console.log('Connecté à la base de données MySQL en tant que ' + db.threadId);
});


const app = express()
const port = 4000
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
// routes
app.get('/', (req, res) => {
    console.log(req);

    res.send('au moins ça restera à vie dans ma tete')
})
app.get('/formulaire', (req, res) => {
    res.send("tu te trouves en ce moment dans le formulaire")
})
app.post('/informations', (req, res) => {
    // recupere les informations
    const { nom, prenom, email, referentiels } = req.body
    console.log(req.body);


    res.send(`vos données ont été bien reçu Monsieur ${nom} ${prenom} ${email} ${referentiels}`)


})
// fin de route
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
