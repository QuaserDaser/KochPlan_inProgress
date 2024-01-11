//Firebase WebApp Konfigurationsdaten (Nötig für Verbindungsaufbau zur Firebase/ zur Firestore Datenbank)
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
        // Fetch the household data from Firestore
        db.collection('households').doc(householdId).get().then((doc) => {
            if (doc.exists) {
                // Display the household data
                document.getElementById('household').textContent = doc.data().name;
            } else {
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });
    }

    

//Alle Zellen der Kalendertabelle holen
    const cells = document.querySelectorAll('td[id]');
// stetiges durchlaufen aller Zellen und auf Eventlistener onClick überprüfen 
    cells.forEach(cell => {
        cell.addEventListener('click', async () => {
        // bei onClick, derzeitige ZellenId in cellID speichern
            const cellId = cell.id;
        //derzeitige Woche mithilfe der getCurrentWeek(n) Funktion ermitteln (anhängig vom Wocheninkrement n); 
            const week = getCurrentWeek(n);
        // holen der Daten aus der derzeitigen Woche (week) aus dem richtigen Haushalt (householdId) 
        // jeweils korrespondierend zur richtigen kollektion (zeige Firestore Datenbank) 
            db.collection('households').doc(householdId).collection('weeks').doc(week).get().then(doc => {
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
                }else{
                    console.log('Dokument nicht verfügbar');
                }
            })
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
        const week = getCurrentWeek(n);
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
        const week = getCurrentWeek(n);
        const allCells = document.querySelectorAll('td[id]');
        db.collection('households').doc(householdId).collection('weeks').doc(week).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
            // Daten einmal ausgaben in Konsole
                console.log('Fetched data:', data); 
            
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
                                    userColor = currentUserColor;
                                }
                            });
                    } else {
                        // Update the content of the cell when needToCook is false
                        cell.textContent = ``;
                    }
                });
            } else {
                console.log('No data found for the current week.');
                allCells.forEach(cell => {
                    cell.textContent = ``;
                });
            }
        }).catch(error => {
            console.error('Error getting document:', error);
            DatenHolenUndVerarbeiten();
        });
    }

    // Call the function to fetch tasks for the current week
    DatenHolenUndVerarbeiten();
    setInterval(DatenHolenUndVerarbeiten, 5000);

    function getWeekRange(n) {
        const now = new Date();
        now.setDate(now.getDate() + (n * 7)); // Move the date by n weeks

        const currentDay = now.getDay();

        // Calculate the first day of the week
        const firstDay = new Date(now.getTime() - (currentDay === 0 ? 6 : currentDay - 1) * 24 * 60 * 60 * 1000);

        // Calculate the last day of the week
        const lastDay = new Date(firstDay.getTime() + 6 * 24 * 60 * 60 * 1000);

        const firstDayFormatted = `${('0' + firstDay.getDate()).slice(-2)}/${('0' + (firstDay.getMonth() + 1)).slice(-2)}/${firstDay.getFullYear() % 100}`;
        const lastDayFormatted = `${('0' + lastDay.getDate()).slice(-2)}/${('0' + (lastDay.getMonth() + 1)).slice(-2)}/${lastDay.getFullYear() % 100}`;

        return `${firstDayFormatted} - ${lastDayFormatted}`;
    }


    function getCurrentWeek(n) {
        const now = new Date();
        const currentDay = now.getDay(); // Get the current day of the week
        const startOfWeek = new Date(now); // Create a copy of the current date

        // Calculate how many days need to be subtracted to get to the start of the current week
        const diff = (currentDay === 0 ? 6 : currentDay - 1); // Adjust if Sunday (0) to 6, else subtract the current day
        startOfWeek.setDate(now.getDate() - diff);

        // Calculate the number of weeks
        const start = new Date(startOfWeek.getFullYear(), 0, 0);
        const diffDays = Math.floor((startOfWeek - start) / (1000 * 60 * 60 * 24));
        const weekNumber = Math.ceil((diffDays + 1 + (n * 7)) / 7);
        return `Week_${weekNumber}`;
    }

    document.getElementById('dialog-close').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog').classList.add('hidden');
        document.getElementById('dialog2').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        // Fetch tasks for the current week
        DatenHolenUndVerarbeiten();
    });

    document.getElementById('dialog-close2').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog2').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        DatenHolenUndVerarbeiten();
    });

    document.getElementById('dialog-close3').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog3').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        DatenHolenUndVerarbeiten();
    });



    const menuBtn = document.getElementById('menu-btn-js');
    const menuBar = document.getElementById('menubar');
    const householdName = document.getElementById('household');
    let menuActive = false;

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

    const currentWeekElement = document.getElementById('current-week');
    // Calculate first and last dates of the current week
    const now = new Date();
    const currentDay = now.getDay();
    const firstDay = new Date(now.getTime() - (currentDay - 1) * 24 * 60 * 60 * 1000);
    const lastDay = new Date(now.getTime() + (7 - currentDay) * 24 * 60 * 60 * 1000);

    // Format the dates as required (assuming 'dd/mm/yyyy' format)
    const firstDayFormatted = `${('0' + firstDay.getDate()).slice(-2)}/${('0' + (firstDay.getMonth() + 1)).slice(-2)}/${firstDay.getFullYear() % 100}`;
    const lastDayFormatted = `${('0' + lastDay.getDate()).slice(-2)}/${('0' + (lastDay.getMonth() + 1)).slice(-2)}/${lastDay.getFullYear() % 100}`;

    const lastWeekBtn = document.getElementById('last-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');


    lastWeekBtn.addEventListener('click', () => {
        n--;
        currentWeekElement.textContent = getWeekRange(n);
        DatenHolenUndVerarbeiten();
    });

    nextWeekBtn.addEventListener('click', () => {
        n++;
        currentWeekElement.textContent = getWeekRange(n);
        DatenHolenUndVerarbeiten();
    });

    currentWeekElement.textContent = getWeekRange(n);



    document.getElementById('username').textContent = username;
    document.getElementById('username2').textContent = username;


    const logOutbtn = document.getElementById('logout-btn');
    logOutbtn.addEventListener('click', () => {
        window.location.href = 'welcome.html';
        localStorage.removeItem('isLoggedIn');
    });

    const inviteUserBtn = document.getElementById('invite-user-btn');
    inviteUserBtn.addEventListener('click', async () => {
        try {
            const week = getCurrentWeek(n);
            const doc = await db.collection('households').doc(householdId).get();
            console.log(doc);
            if (doc.exists) {
                const codeToShare = doc.data().code;
                const householdName = doc.data().name;
                const baseURL = 'https://kochplan.prydox-tech.de';
                const sharePath = '/welcome.html';
                const shareURL = new URL(sharePath, baseURL);

                // Append the code as a URL parameter
                shareURL.searchParams.append('code', codeToShare);

                console.log(codeToShare);
                console.log(householdName);

                await navigator.share({
                    title: 'Code zum Einladen weiterleiten',
                    text: `Tritt dem Haushalt ${householdName} mit dem Code ${codeToShare} bei.`,
                    url: shareURL.href, // Use the href of the URL object
                });

                console.log('Code shared successfully');
            } else {
                console.error('Document does not exist');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    const colorPicker = document.getElementById('colorPicker');
    const customUserBtn = document.getElementById('custom-user-btn');
    customUserBtn.addEventListener('click', async () => {
        document.getElementById('dialog3').classList.remove('hidden');
        document.getElementById('backdrop').classList.remove('hidden');
        console.log(userColor);
        colorPicker.value = userColor;
    });

    const customUserDoneBtn = document.getElementById('done2');
    customUserDoneBtn.addEventListener('click', async () => {
        const selectedColor = colorPicker.value;
        console.log(selectedColor);
        // Reference the specific household document
        const householdRef = db.collection('households').doc(householdId);

        // Construct the data object to set the color for the username in the 'users-custom' field
        const customUserData = {};
        customUserData[username] = { color: selectedColor };

        // Update the 'users-custom' field with the color corresponding to the username
        householdRef.set({ 'users-custom': customUserData }, { merge: true })
            .then(() => {
                console.log('Color added to the specific user in the "users-custom" array field');
            })
            .catch((error) => {
                console.error('Error adding color to the specific user in the "users-custom" array field:', error);
            });

        document.getElementById('dialog3').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        DatenHolenUndVerarbeiten();
    });

});