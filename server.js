import express from 'express';
import mysql2 from 'mysql2';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

function createTransporter(userEmail, userPassword) {
    let service;

    if (userEmail.includes('gmail.com')) {
        service = 'gmail';
    } else if (userEmail.includes('yahoo.com')) {
        service = 'yahoo';
    } else {
        throw new Error('Service non supporté');
    }

    return nodemailer.createTransport({
        service: service,
        auth: {
            user: userEmail,
            pass: userPassword
        }
    });
}

const userEmail = process.env.USER_EMAIL;
const userPassword = process.env.USER_PASSWORD;

const transporter = createTransporter(userEmail, userPassword);

function envoyerEmail(destinataire, contenu) {
    const mailOptions = {
        from: userEmail,
        to: destinataire,
        subject: 'Récapitulatif de vos données',
        text: contenu
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Erreur lors de l\'envoi de l\'email:', error);
        } else {
            console.log('Email envoyé avec succès:', info.response);
        }
    });
}

const db = mysql2.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET
});

db.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données: ' + err.stack);
        return;
    }
    console.log('Connecté à la base de données MySQL en tant que ' + db.threadId);
});

const app = express();
const port = 4000;

// Middleware pour parser les données JSON et URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration du proxy
app.use(createProxyMiddleware({
    target: 'https://formulaire-backend.onrender.com', // Remplace par l'URL de ton backend
    changeOrigin: true,
}));

app.get('/', (req, res) => {
    res.send('au moins ça restera à vie dans ma tête');
});

app.get('/formulaire', (req, res) => {
    res.send('tu te trouves en ce moment dans le formulaire');
});

// Route pour traiter les informations
app.post('/informations', (req, res) => {
    const { nom, prenom, email, referentiel, quartier, numeros, sex } = req.body;

    const checkEmailSql = 'SELECT * FROM utilisateurs WHERE email = ?';
    db.query(checkEmailSql, [email], (err, results) => {
        if (err) {
            console.error('Erreur lors de la vérification de l\'email: ' + err.stack);
            return res.status(500).send('Erreur lors de la vérification de l\'email.');
        }

        if (results.length > 0) {
            return res.status(400).send('Cet email est déjà utilisé.');
        }

        const insertSql = 'INSERT INTO utilisateurs (nom, prenom, email, referentiel, quartier, numeros, sex) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const values = [nom, prenom, email, referentiel, quartier, numeros, sex];

        db.query(insertSql, values, (err, results) => {
            if (err) {
                console.error('Erreur lors de l\'insertion dans la base de données: ' + err.stack);
                return res.status(500).send('Erreur lors de l\'insertion des données.');
            }

            const contenuEmail = `Bonjour ${prenom} ${nom},\n\nVoici le récapitulatif de vos informations:\n\nNom: ${nom}\nPrénom: ${prenom}\nEmail: ${email}\nRéférentiel: ${referentiel}\nQuartier: ${quartier}\nNuméros: ${numeros}\nSex: ${sex}\n\nMerci de votre inscription.`;

            envoyerEmail(email, contenuEmail);

            res.send(`Vos données ont été bien reçues, un récapitulatif a été envoyé à ${email}.`);
        });
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
