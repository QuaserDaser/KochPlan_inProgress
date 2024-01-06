// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAge5KBOpZZHB6UBClofy4M1-pJRhZItVc",
    authDomain: "kochplan-c7d15.firebaseapp.com",
    projectId: "kochplan-c7d15",
    storageBucket: "kochplan-c7d15.appspot.com",
    messagingSenderId: "811343664645",
    appId: "1:811343664645:web:09cb99d070bba357862e6c"
};

document.addEventListener('DOMContentLoaded', (event) => {

    // Initialize Firebase
    const app = firebase.initializeApp(firebaseConfig);
    const analytics = firebase.analytics(app);

    // Initialize Firestore
    const db = firebase.firestore(app);

    // Get the household ID and the username from the local storage
    const householdId = localStorage.getItem('householdId');
    const username = localStorage.getItem('username');


    // If the household ID or the username doesn't exist, redirect to the welcome.html page
    if (!householdId || !username) {
        window.location.href = 'welcome.html';
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

    // Get all cells
    const cells = document.querySelectorAll('td[id]');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            // Show the dialog box and the backdrop
            document.getElementById('dialog').classList.remove('hidden');
            document.getElementById('backdrop').classList.remove('hidden');
            // Save the cell id to use later
            localStorage.setItem('cellId', cell.id);
        });
    });

    document.getElementById('done').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        // Get entered data
        const description = document.getElementById('description').value;
        const needToCook = document.getElementById('needToCook').checked;

        // Save data to Firebase
        const week = getCurrentWeek();
        const cellId = localStorage.getItem('cellId');
        console.log('Cell ID from localStorage:', cellId);

        const splitCellId = cellId ? cellId.split('-') : null;
        console.log('Split result:', splitCellId);

        const day = splitCellId ? splitCellId[0] : null;
        const meal = splitCellId ? splitCellId[1] : null;
        console.log('Day:', day, 'Meal:', meal);
        const assignedUser = username;
        console.log(cellId);

        db.collection('households').doc(householdId).collection('weeks').doc(week).set({
            [`${day}.${meal}.description`]: description,
            [`${day}.${meal}.assignedUser`]: assignedUser,
            [`${day}.${meal}.needToCook`]: needToCook
        }, { merge: true });
        const targetCell = document.getElementById(cellId);
        targetCell.textContent = assignedUser;
        // Fetch tasks for the current week
        fetchAndFilterDataForCooking();

    });






    function fetchAndFilterDataForCooking() {
        const week = getCurrentWeek();
        const allCells = document.querySelectorAll('td[id]');
        db.collection('households').doc(householdId).collection('weeks').doc(week).get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                console.log('Fetched data:', data); // Print the fetched data

                // Loop through all cells

                allCells.forEach(cell => {
                    const cellId = cell.id;
                    const [day, meal] = cellId.split('-');
                    const needToCook = data[`${day}.${meal}.needToCook`];

                    if (needToCook === true) {
                        // Update the content of the cell when needToCook is true
                        const assignedUser = data[`${day}.${meal}.assignedUser`];
                        cell.textContent = `${assignedUser}`;
                    } else {
                        // Update the content of the cell when needToCook is false
                        cell.textContent = `(Kocht: false)`;
                    }
                });
            } else {
                console.log('No data found for the current week.');
                allCells.forEach(cell => {
                    cell.textContent = `(Kocht: false)`;
                });
            }
        }).catch(error => {
            console.error('Error getting document:', error);
        });
    }









    // Call the function to fetch tasks for the current week
    fetchAndFilterDataForCooking();
    setInterval(fetchAndFilterDataForCooking, 5000);

    function getCurrentWeek() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = (now - start) + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
        const oneDay = 1000 * 60 * 60 * 24;
        const day = Math.floor(diff / oneDay);
        return `Week_${Math.ceil(day / 7)}`;
    }

    document.getElementById('dialog-close').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        // Fetch tasks for the current week
        fetchAndFilterDataForCooking();
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

    // Update the second h1 element to display the first and last dates of the current week
    currentWeekElement.textContent = `${firstDayFormatted} - ${lastDayFormatted}`;



    document.getElementById('username').textContent = username;
    document.getElementById('username2').textContent = username;

    const logOutbtn = document.getElementById('logout-btn');
logOutbtn.addEventListener('click', () => {
    window.location.href = 'welcome.html';
});

const inviteUserBtn = document.getElementById('invite-user-btn');
inviteUserBtn.addEventListener('click', async () => {
    try {
        const week = getCurrentWeek();
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



});