// Firebase WebApp Konfigurationsdaten (Nötig für Verbindungsaufbau zur Firebase/ zur Firestore Datenbank)
const firebaseConfig = {
    apiKey: "AIzaSyAge5KBOpZZHB6UBClofy4M1-pJRhZItVc",
    authDomain: "kochplan-c7d15.firebaseapp.com",
    projectId: "kochplan-c7d15",
    storageBucket: "kochplan-c7d15.appspot.com",
    messagingSenderId: "811343664645",
    appId: "1:811343664645:web:09cb99d070bba357862e6c"
};

//Firebase initialisierung
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics(app);
const db = firebase.firestore(app);

// Verschiedenste Elemente aus HTML Dokument holen
const createHouseholdBtn = document.getElementById('create-household-btn');
const joinHouseholdBtn = document.getElementById('join-household-btn');
const createHouseholdDiv = document.getElementById('create-household');
const householdNameInput = document.getElementById('household-name-input');
const nextBtn = document.getElementById('next-btn');
const createUserDiv = document.getElementById('create-user');
const usernameInput = document.getElementById('username-input');
const createUserBtn = document.getElementById('create-user-btn');
const createBackBtn = document.getElementById('goback-btn');
const createBackDiv = document.getElementById('goback-btn');
const joinHouseholdDiv = document.getElementById('join-household');
const householdCodeInput = document.getElementById('household-code-input');
const joinBtn = document.getElementById('join-btn');
const selectUserDiv = document.getElementById('select-user');
const usersTable = document.getElementById('users-table');
const newUsernameInput = document.getElementById('new-username-input');
const createJoinUserBtn = document.getElementById('create-join-user-btn');

// Haushalt erstellen eventListener onClick
createHouseholdBtn.addEventListener('click', () => {
    // Dementsprechendes anzeigen/verstecken der benötigten Folgelemenete
    createHouseholdBtn.style.display = 'none';
    joinHouseholdBtn.style.display = 'none';
    createHouseholdDiv.style.display = 'block';
    createBackDiv.style.display = 'flex';
});


// Weiter Button nur freigebn, wenn Text im Input Feld
householdNameInput.addEventListener('input', () => {
    nextBtn.disabled = !householdNameInput.value;
});

// Weiter Button onClick und dementsprechende Elemente anzeigen / verstecken
nextBtn.addEventListener('click', () => {
    createHouseholdDiv.style.display = 'none';
    createUserDiv.style.display = 'block';
});

// Dunktion zur Ermittlung des an den Einladungslink angehängten Code
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}



let isAutoFilled = false; // Flag zum einmaligen aufrufen der autoFill Funktion  

// autoFill Funktion, welche automatische, wenn EInladungslink vorhanden zum "Bestehendem Haushalt Beitreten" Teil weiter geht und den Code einträgt
function autoFill() {
    const sharedCode = getUrlParameter('code');
    if (sharedCode && !isAutoFilled) {
        console.log(sharedCode);
        householdCodeInput.value = sharedCode;
        isAutoFilled = true;
        joinHouseholdBtn.click();
        updateCodeStatus();
    }
}

// Onload die autoFill aufrufen
window.onload = autoFill;


// Bestehendem Haushalt beitreten Button
joinHouseholdBtn.addEventListener('click', () => {
    createHouseholdBtn.style.display = 'none';
    joinHouseholdBtn.style.display = 'none';
    joinHouseholdDiv.style.display = 'block';
    createBackDiv.style.display = 'flex';
});

// Nutzer erstellen nur möglich Wenn Input Feld gefüllt
usernameInput.addEventListener('input', () => {
    createUserBtn.disabled = !usernameInput.value;
});

// Zurückbutton lädt seite neu
createBackBtn.addEventListener('click', () => {
    window.location.href = 'welcome.html';
})

// Einzigartigen Haushaltscode erstellen Funktion
async function generateUniqueCode() {
    let istEizigartig = false;
    let code = '';

    while (!istEizigartig) {
        // Random Code generieren
        code = Math.floor(Math.random() * 100000).toString();

        // Alle Codes der Haushälter holen
        const codeFetch = await db.collection('households').get();

        let codeEinzigartig = true;
        codeFetch.forEach((doc) => {
            const codeFetched = doc.data().code;
            if (code === codeFetched) {
                codeEinzigartig = false;
                return; // Wenn ein gleicher Code gefunden wurde, forEach Schleife verlassen
            }
        });

        if (codeEinzigartig) {
            // Code ist einzigartig, fertig!
            istEizigartig = true;
        }
    }

    return code;
}


// Haushalt und Nutzer Erstellen button 
createUserBtn.addEventListener('click', async () => {
    // Code generieren mit oben beschriebener Funktion
    const code = await generateUniqueCode();
    // Neuen Haushalt in Datenbank erstellen und Daten speichern
    db.collection('households').add({
        name: householdNameInput.value,
        users: [usernameInput.value],
        code: code
    })
        .then((docRef) => {
            console.log(`Household created with ID: ${docRef.id}`);
            // HaushaltID in localstorage speichern um spätere Identifikation zu sichern
            localStorage.setItem('householdId', docRef.id);
            // Nutzername als LocalStorage speichern um diesen Später abzurufen
            localStorage.setItem('username', usernameInput.value);
            // Zur index.html weiterleiten
            window.location.href = 'index.html';
            // isLoggedIn flag setzen fürs Spätere Routing 
            localStorage.setItem('isLoggedIn', 'true');
        })
        .catch((error) => {
            console.error(`Dokument konnte nicht erstellt werden: ${error}`);
        });
});

// Anzeige ob der Code verfügbar ist
const CodeAnzeige = document.getElementById('code-status-icon');
function updateCodeStatus(){

    // Array welches alle Haushaltscodes speichert
    const householdCodes = [];

    db.collection('households').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Codes in das Code Array schieben
        const code = data.code;
        householdCodes.push(code);
    });

    // Mit includes Funktion überprüfen, ob der eingegebene Code mit einem Haushaltscode übereinstimmen
    // wenn, Haken setzen, ansonsten Kreuz und dementsprechen grün oder rot
    if (householdCodes.includes(householdCodeInput.value)) {
        console.log(`The array contains ${householdCodeInput.value}.`);
        CodeAnzeige.classList.remove('fa-times');
        CodeAnzeige.classList.add('fa-check');
        CodeAnzeige.style.color = 'green';
    } else {
        console.log(`The array does not contain ${householdCodeInput.value}.`);
        CodeAnzeige.classList.remove('fa-check');
        CodeAnzeige.classList.add('fa-times');
        CodeAnzeige.style.color = 'red';
    }
    }).catch((error) => {
        console.error('Codes nicht abrufbar: ', error);
    });

}
householdCodeInput.addEventListener( 'input', () =>{
    // Join Button nur klickbar, wenn CodeFeld gefüllt
    joinBtn.disabled = !householdCodeInput.value;
    updateCodeStatus();
})


// Beitreten Button mit helper Funktion um Verbindungsfehler mit Firebase zum Umgehen, führt zum 6xmaligen aufrufen der Beitreten-Logik
let indexCheck = 0;
joinBtn.addEventListener('click', () => {
    indexCheck = 0;
    helper();
});

function helper(){
    // Beitreten Logik
    db.collection('households').where('code', '==', householdCodeInput.value).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // Wenn Code da, divs zeigen / verstecken
                joinHouseholdDiv.style.display = 'none';
                selectUserDiv.style.display = 'block'; 
                // die dementsprechende HaushaltsID in localStorage Speichern
                localStorage.setItem('householdId', querySnapshot.docs[0].id);
                // alle Nutzer dieses Haushalts in der Nutzertabelle anzeigen
                const users = querySnapshot.docs[0].data().users;
                usersTable.innerHTML = users.map(user => `<tr><td>${user}</td></tr>`).join('');
            } else {
                console.error('Haushalt nicht gefunden!');
                if(householdCodeInput.value != '' && indexCheck < 6){
                    helper();
                    indexCheck ++;
                }
            }
        })
        .catch((error) => {
            console.error(`Dokumente konnten nicht geholt werden:  ${error}`);
        });
}


// Neuen Nutzer zum Beigetreten Haushalt hinzufügen nur möglich, wenn Nutzername eingetragen
newUsernameInput.addEventListener('input', () => {
    createJoinUserBtn.disabled = !newUsernameInput.value;
});

// Nutzertabelle abfragen, wenn auf Nutzername aus Tabelle geklicket wird
usersTable.addEventListener('click', (event) => {
    if (event.target.tagName === 'TD') {
        // Wenn click, Nutzer dementsprechend setzten und weiterleiten auf Index sowie login flag setzen
        localStorage.setItem('username', event.target.textContent);
        window.location.href = 'index.html';
        localStorage.setItem('isLoggedIn', 'true');
    }
});

// Neuen Nutzer erstellen und Beitreten
createJoinUserBtn.addEventListener('click', () => {
    // Nutzer zum Haushalt in Firestore hinzufügen
    const householdId = localStorage.getItem('householdId');
    db.collection('households').doc(householdId).update({
        users: firebase.firestore.FieldValue.arrayUnion(newUsernameInput.value)
    })
        .then(() => {
            console.log('User added to the household');
            // Nutzername dementpsrechend als LocalStorage speichern 
            localStorage.setItem('username', newUsernameInput.value);
            // Weiterleiten zu Index und loggedIn flag setzen
            window.location.href = 'index.html';
            localStorage.setItem('isLoggedIn', 'true');
        })
        .catch((error) => {
            console.error(`Nutzer konnte dem Haushalt nicht hinzugefügt werden: ${error}`);
        });

});



document.addEventListener('DOMContentLoaded', function() {
    // CodeAnzeige beim start auf Rot setzen 
    CodeAnzeige.style.color = 'red';

    // Routing, schauen ob die isLoggedIn flag gesetzt ist
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
      // Wenn eingeloggt, auf Index sofort weiterleiten
      window.location.href = 'index.html';
    }
  });