// Firebase WebApp Konfigurationsdaten (Nötig für Verbindungsaufbau zur Firebase/ zur Firestore Datenbank)
const firebaseConfig = {
    apiKey: "AIzaSyAge5KBOpZZHB6UBClofy4M1-pJRhZItVc",
    authDomain: "kochplan-c7d15.firebaseapp.com",
    projectId: "kochplan-c7d15",
    storageBucket: "kochplan-c7d15.appspot.com",
    messagingSenderId: "811343664645",
    appId: "1:811343664645:web:09cb99d070bba357862e6c"
};

// index.html vollkommen geladen, dann:
document.addEventListener('DOMContentLoaded', (event) => {

//Firebase initialisierung
    const app = firebase.initializeApp(firebaseConfig);
    const analytics = firebase.analytics(app);
    const db = firebase.firestore(app);

// Holen der gespeicherten Daten durch die Auth.js vom Local Storage
    const householdId = localStorage.getItem('householdId');
    const username = localStorage.getItem('username');
    const kochAnzeige = document.getElementById('kochender');
    const gerichtAnzeige = document.getElementById('gericht');

// Zählvariable für das Wocheninkrement
    let n = 0; 
// Nutzerfarbe als Variable zur Färbung des Benutzernames in der Tabelle
    let userColor;

// Routingfunktion: zur überprüfung, ob der Nutzer schon eingeloggt ist. Abrufen des Local Storage items
// isLoggedIn
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
            window.location.href = 'welcome.html';
        }
    }
// Aufruf nach dem laden der HTML Datei von der Routing Funktion 
    checkLoginStatus();

// Erneut überprüfen, ob eine HaushaltsId oder ein Benutzername zugewiesen ist, wenn nicht, 
// zurück zur Anmeldeseite und login Status auf false setzen 
    if (!householdId || !username) {
        window.location.href = 'welcome.html';
        localStorage.removeItem('isLoggedIn');
    } else {
        // Holen der Haushaltsdaten von Firestore
        db.collection('households').doc(householdId).get().then((doc) => {
            if (doc.exists) {
                // H1 Element auf Haushaltsname setzten
                document.getElementById('household').textContent = doc.data().name;
            } else {
                console.log("Dokument nicht vorhanden");
            }
        }).catch((error) => {
            console.log("Fehler beim Laden des Dokuments: ", error);
        });
    }

    

//Alle Zellen der Kalendertabelle holen
    const cells = document.querySelectorAll('td[id]');
// stetiges Durchlaufen aller Zellen und auf Eventlistener onClick überprüfen
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        // bei onClick, derzeitige ZellenId in cellID speichern
        const cellId = cell.id;
        // derzeitige Woche mithilfe der getWochenIndikator(n) Funktion ermitteln (abhängig vom Wocheninkrement n);
        const week = getWochenIndikator(n);

        // Referenz zum Haushalt und der Woche erstellen
        const householdRef = db.collection('households').doc(householdId);
        const weekRef = householdRef.collection('weeks').doc(week);

        // Überprüfen, ob das week_n Dokument existiert
        weekRef.get().then(weekDoc => {
            if (!weekDoc.exists) {
                // Wenn nicht existiert, erstelle das Dokument
                weekRef.set({});
            }

            // Jetzt Daten aus der derzeitigen Woche (week) aus dem richtigen Haushalt (householdId)
            // jeweils korrespondierend zur richtigen Kollektion (zeige Firestore Datenbank)
            weekRef.get().then(doc => {
                if (doc.exists) {
                // abrufen der Daten aus dem week_n Dokument in die variable data 
                    const data = doc.data();
                // teilen der cellId in ihre zwei Bestandteile welche durch "-" getrennt sind
                // nähmlich day und meal bspw: "monday-lunch" 
                    const [day, meal] = cellId.split('-');
                // holen des needToCook Feldes aus dem "data-array" 
                    const needToCook = data[`${day}.${meal}.needToCook`];
                // definieren des beschreibungsFelds zum späteren bearbeiten des Inhalt basierend auf dem angemeldeten Nutzer
                    const descriptionInput = document.getElementById('description');
                // Wenn "in diesem Feld" noch nicht gekocht wird bzw die anderen Fälle
                    if (needToCook === undefined) {
                    // Dialogfeld zeigen und Gerichtinput auf Leer setzen
                        document.getElementById('dialog').classList.remove('hidden');
                        document.getElementById('backdrop').classList.remove('hidden');
                    // ZellenID in localStorage speichern für spätere Datenzuweisung
                        localStorage.setItem('cellId', cellId);
                        descriptionInput.value = '';
                    } else {
                        if (data[`${day}.${meal}.assignedUser`] == username) {
                        // Wenn das geklickte Feld vom "Koch" also angemeldeten Nutzer selbst ist, Dialogfeld
                        // dem an dem Tag vorgesehenem Gericht im Gerichtfeld anzeigen 
                            document.getElementById('dialog').classList.remove('hidden');
                            document.getElementById('backdrop').classList.remove('hidden');
                            localStorage.setItem('cellId', cellId);

                            descriptionInput.value = data[`${day}.${meal}.description`];
                        } else {
                        // Wenn das geklickte Feld vom einem anderem "Koch" ist, 2 Dialogfeld mit zuständigem Koch
                        // und, wenn vorhanden, dem zugehörigen gericht anzeigen 
                            document.getElementById('dialog2').classList.remove('hidden');
                            document.getElementById('backdrop').classList.remove('hidden');
                            const cook = data[`${day}.${meal}.assignedUser`];
                            const gericht = data[`${day}.${meal}.description`]
                            kochAnzeige.textContent = cook;
                            if (gericht != "") {
                                gerichtAnzeige.textContent = gericht;
                            } else {
                                gerichtAnzeige.textContent = 'Keine Angabe';
                            }
                        }
                    }
                } else {
                    console.log('Dokument nicht verfügbar');
                }
            });
        });
    });
});

// Fertig Button Dialog Koch-Eintragung
    document.getElementById('done').addEventListener('click', () => {
    // Dialogund Hintergund verstecken
        document.getElementById('dialog').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
    // Daten aus Input Feld und Ankreuz-Item holen
        const description = document.getElementById('description').value;
        const needToCook = document.getElementById('toggle1').checked;

    // Daten in Firebase speichern
    
    // Derzeitige Woche in abhängigkeit von n für Kollections-Speicherung in Weeks_n
        const week = getWochenIndikator(n);
    // ZellenID aus LocalStorage holen
        const cellId = localStorage.getItem('cellId');
        const targetCell = document.getElementById(cellId);
    // ZellenID splitten um tag und zeitpunktzu ermitteln
        const [day, meal] = cellId.split('-');
        console.log('Day:', day, 'Meal:', meal);
        const assignedUser = username;
        console.log(cellId);
    // Wenn Koch zusagt, Daten an dementsprechend Tag zum ZEitpunkt spewichern (Morgens,Mittags,Abends)
        if (needToCook) {
            db.collection('households').doc(householdId).collection('weeks').doc(week).set({
                [`${day}.${meal}.description`]: description,
                [`${day}.${meal}.assignedUser`]: assignedUser,
                [`${day}.${meal}.needToCook`]: needToCook
            }, { merge: true });
        // Setzen des Zelltextes auf den Koch (angemeldeter Nutzer)
            targetCell.textContent = assignedUser;
        } else {
    // Wenn Koch sagt, er will nicht Kochen, veruschen, wenn vorhanden das Datenfeld an dem Tag zum
    // Zeitpunkt zu löschen, um Koch auszutragen
            const data = {};
            data[`${day}.${meal}.description`] = firebase.firestore.FieldValue.delete();
            data[`${day}.${meal}.assignedUser`] = firebase.firestore.FieldValue.delete();
            data[`${day}.${meal}.needToCook`] = firebase.firestore.FieldValue.delete();

            db.collection('households').doc(householdId).collection('weeks').doc(week)
                .set(data, { merge: true })
                .then(() => {
                // Wenn gelöscht, Konsolenbestätigung und Zell-Text auf leer setzen
                    console.log('Felder gelöscht');
                    targetCell.textContent = '';
                })
                .catch((error) => {
                    console.error('Fehler beim Löschen:', error);
                });
        }
    });


// Polling Funktion zum holen der dAtenbankdaten und zum richtigen Befüllen der Tabelle (Da keine Realtime Database -> Polling)
    function DatenHolenUndVerarbeiten() {
        const week = getWochenIndikator(n);
        const allCells = document.querySelectorAll('td[id]');
        db.collection('households').doc(householdId).collection('weeks').doc(week).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
            // Daten einmal ausgaben in Konsole
                console.log('Daten: ', data); 
            
            // Durchlaufen aller Zellen und dementsprechende Zweisung der Daten auf basis des NeedToCook Attributs
                allCells.forEach(cell => {
                // Teilen der ZellenID in Day und Meal
                    const cellId = cell.id;
                    const [day, meal] = cellId.split('-');
                    const needToCook = data[`${day}.${meal}.needToCook`];
                // Auf NeedToCook attribut abfragen und wenn wahr, Daten holen und eintragen
                    if (needToCook === true) {
                    // Zelleninhalt updaten
                        const assignedUser = data[`${day}.${meal}.assignedUser`];
                        cell.textContent = `${assignedUser}`;
                    // Holen (falls vorhanden) der Nutzerfarbe aus dem users-custom Feld
                        db.collection('households')
                            .doc(householdId)
                            .get()
                            .then((doc) => {
                                if (doc.exists) {
                                    const userData = doc.data();
                                // Holen des Users-Custom Feld
                                    const usersCustom = userData['users-custom'] || {};
                                // Setzen der userColor Variable
                                    let currentUserColor = usersCustom[assignedUser]?.color || '';
                                    cell.style.color = currentUserColor;
                                }
                            });
                    } else {
                        // Update the content of the cell when needToCook is false
                        cell.textContent = ``;
                    }
                });
            } else {
                console.log('Keine Daten für diese Woche gefunden');
                allCells.forEach(cell => {
                    cell.textContent = ``;
                });
            }
        }).catch(error => {
            console.error('Dokemunt nicht verfügbar', error);
            location.reload();
        });
    }

// Polling der DatenHolen Funktion
    DatenHolenUndVerarbeiten();
    setInterval(DatenHolenUndVerarbeiten, 2000);

// Funktion zur berechnung des Ersten und Letzten Tags der Woche mit abstandsfaktor n
    function ErstesUndLetztesDatum(n) {
        const now = new Date();
    // Einbeziehen der n variable um die richtige Woche zu erhalten n * 7 Tage
        now.setDate(now.getDate() + (n * 7));

        const currentDay = now.getDay();

    // Erster Tag der Woche
        const firstDay = new Date(now.getTime() - (currentDay === 0 ? 6 : currentDay - 1) * 24 * 60 * 60 * 1000);

    // Letzter Tag der Woche
        const lastDay = new Date(firstDay.getTime() + 6 * 24 * 60 * 60 * 1000);
    // Formatierung der beiden Variablen
        const firstDayFormatted = `${('0' + firstDay.getDate()).slice(-2)}/${('0' + (firstDay.getMonth() + 1)).slice(-2)}/${firstDay.getFullYear() % 100}`;
        const lastDayFormatted = `${('0' + lastDay.getDate()).slice(-2)}/${('0' + (lastDay.getMonth() + 1)).slice(-2)}/${lastDay.getFullYear() % 100}`;
    // Rückgabe der "Datumsspanne"
        return `${firstDayFormatted} - ${lastDayFormatted}`;
    }

// Berechnung der Wochenzahl in abhängigkeit von n
    function getWochenIndikator(n) {
        const now = new Date();
    // Jetziges Datum holen und Kopie davon machen
        const currentDay = now.getDay();
        const startOfWeek = new Date(now);

    // Differenz der Tage bis Wochenanfang errechnen, Da Sonntag indikator 0 hat, auf 6 setzten
    // um zu verhindern, das am Sonntag schon die nächste Woche ist
        const diff = (currentDay === 0 ? 6 : currentDay - 1);
        startOfWeek.setDate(now.getDate() - diff);

    // Wochennummer ermitteln
        const start = new Date(startOfWeek.getFullYear(), 0, 0);
        const diffDays = Math.floor((startOfWeek - start) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.ceil((diffDays + 1 + (n * 7)) / 7);
        return `Week_${weekNumber}`;
    }

// Schließen Button für Dialogfenster
    document.getElementById('dialog-close').addEventListener('click', () => {
    // Displayflag auf hidden (versteckt) setzten
        document.getElementById('dialog').classList.add('hidden');
        document.getElementById('dialog2').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
    // Daten erneuern
        DatenHolenUndVerarbeiten();
    });

// Schließen Button für Dialogfenster
    document.getElementById('dialog-close2').addEventListener('click', () => {
        document.getElementById('dialog2').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        DatenHolenUndVerarbeiten();
    });

// Schließen Button für Dialogfenster
    document.getElementById('dialog-close3').addEventListener('click', () => {
        document.getElementById('dialog3').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        DatenHolenUndVerarbeiten();
    });


// Deklarationen und Initialisierungen von dem Menü (Navigationsbar)
    const menuBtn = document.getElementById('menu-btn-js');
    const menuBar = document.getElementById('menubar');
    const householdName = document.getElementById('household');
    let menuActive = false;

// Toggeln der Menübar
    menuBtn.addEventListener('click', () => {
        if (menuActive) {
            householdName.style.color = 'var(--text-primary)';
            document.getElementById('backdrop2').classList.add('hidden');
        } else {
            householdName.style.color = 'var(--primary-dark)';
            document.getElementById('backdrop2').classList.remove('hidden');
        }
        menuActive = !menuActive;
        menuBar.classList.toggle('active');
        menuBtn.classList.toggle('pushed');
        householdName.classList.toggle('active');
    });

// Deklarationen von Datumsdisplay und den Wochenwechselbuttons
    const currentWeekElement = document.getElementById('current-week');
    const lastWeekBtn = document.getElementById('last-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');

// Bei klick n dementsprechend erhöhren bzw verringern
    lastWeekBtn.addEventListener('click', () => {
        n--;
        currentWeekElement.textContent = ErstesUndLetztesDatum(n);
        DatenHolenUndVerarbeiten();
    });

    nextWeekBtn.addEventListener('click', () => {
        n++;
        currentWeekElement.textContent = ErstesUndLetztesDatum(n);
        DatenHolenUndVerarbeiten();
    });

    currentWeekElement.textContent = ErstesUndLetztesDatum(n);


// Setzen der Span Tags auf den Nutzernamen
    document.getElementById('username').textContent = username;
    document.getElementById('username2').textContent = username;

//Log-Out-Btn -> zurück zur Welcome.html und isLoggedIn flag löschen um Routing zum gewährleisten
    const logOutbtn = document.getElementById('logout-btn');
    logOutbtn.addEventListener('click', () => {
        window.location.href = 'welcome.html';
        localStorage.removeItem('isLoggedIn');
    });

// Invite User mit navigator.share class, erstellen einer URL mit "Code-Suffix" um automatische ausfüllung des Haushaltscode Felds 
// beim LogIn zu ermöglichen 
    const inviteUserBtn = document.getElementById('invite-user-btn');
    inviteUserBtn.addEventListener('click', async () => {
        try {
        // Holen des Haushaltsspeziffischen Codes
            const doc = await db.collection('households').doc(householdId).get();
            console.log(doc);
            if (doc.exists) {
                const codeToShare = doc.data().code;
                const householdName = doc.data().name;
            // Zusammensetzen der URl mtihilfe der baseURL, des sharePaths und dem searchParam code
                const baseURL = 'https://kochplan.prydox-tech.de';
                const sharePath = '/welcome.html';
                const shareURL = new URL(sharePath, baseURL);
                shareURL.searchParams.append('code', codeToShare);

                console.log(codeToShare);
                console.log(householdName);
            // Navigator.share aufrufem und Nachricht erstellen
                await navigator.share({
                    title: 'Code zum Einladen weiterleiten',
                    text: `Tritt dem Haushalt ${householdName} mit dem Code ${codeToShare} bei. Oder verwende diesen Link: `,
                    url: shareURL.href,
                });

                console.log('Teilen Erfolgreich');
            } else {
                console.error('Dokument nicht verfügbar');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

const colorPicker = document.getElementById('colorPicker');
const customUserBtn = document.getElementById('custom-user-btn');

customUserBtn.addEventListener('click', () => {
    document.getElementById('dialog3').classList.remove('hidden');
    document.getElementById('backdrop').classList.remove('hidden');

    db.collection('households').doc(householdId).get().then(async (doc) => {
        if (doc.exists) {
            const userData = doc.data();
        // Holen des Users-Custom Feld
            usersCustom = userData['users-custom'] || {};
            
        // Holen der Nutzerfarbe um "ColorPicker PreValue" zu setzten 
            try {
                userColor = await usersCustom[username]?.color || '';
                console.log(username, userColor);
                colorPicker.value = userColor;
            } catch (error) {
                console.error('Nutzer-Farbe konnte nicht geholt werden: ', error);
            }
        }
    });
});

    const customUserDoneBtn = document.getElementById('done2');
    customUserDoneBtn.addEventListener('click', () => {
        const selectedColor = colorPicker.value;
        console.log(selectedColor);
        // Referenz zum Haushalt erstellen
        const householdRef = db.collection('households').doc(householdId);

        // Daten für Nutzer Anpassung vorbereiten
        const customUserData = {};
        customUserData[username] = { color: selectedColor };

        // users-custom Feld updaten und Wert entweder erneuern oder neuen users-custom hinzufügen
        householdRef.set({ 'users-custom': customUserData }, { merge: true })
            .then(() => {
                console.log('Farbe hinzugefügt zum "users-custom" Array Feld');
            })
            .catch((error) => {
                console.error('Fehler beim hinzufügen der Daten zum spezifischen Nutzer: ', error);
            });

        document.getElementById('dialog3').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        DatenHolenUndVerarbeiten();
    });

});