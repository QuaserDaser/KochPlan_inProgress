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
    const kochAnzeige = document.getElementById('kochender');
    const gerichtAnzeige = document.getElementById('gericht');

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

    let n = 0;
    let userColor;

    // Get all cells
    const cells = document.querySelectorAll('td[id]');
    cells.forEach(cell => {
        cell.addEventListener('click', async () => {
            const cellId = cell.id;
            const week = getCurrentWeek(n);
            const allCells = document.querySelectorAll('td[id]');
            db.collection('households').doc(householdId).collection('weeks').doc(week).get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    const [day, meal] = cellId.split('-');
                    const needToCook = data[`${day}.${meal}.needToCook`];
                    const descriptionInput = document.getElementById('description');
                    if (needToCook === undefined) {
                        document.getElementById('dialog').classList.remove('hidden');
                        document.getElementById('backdrop').classList.remove('hidden');
                        localStorage.setItem('cellId', cellId);
                        descriptionInput.value = '';
                    } else {
                        if (data[`${day}.${meal}.assignedUser`] == username) {
                            document.getElementById('dialog').classList.remove('hidden');
                            document.getElementById('backdrop').classList.remove('hidden');
                            localStorage.setItem('cellId', cellId);

                            descriptionInput.value = data[`${day}.${meal}.description`];
                        } else {
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
                }
            })
        });
    });


    document.getElementById('done').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        // Get entered data
        const description = document.getElementById('description').value;
        const needToCook = document.getElementById('toggle1').checked;

        // Save data to Firebase

        const week = getCurrentWeek(n);
        const cellId = localStorage.getItem('cellId');
        const targetCell = document.getElementById(cellId);
        console.log('Cell ID from localStorage:', cellId);

        const splitCellId = cellId ? cellId.split('-') : null;
        console.log('Split result:', splitCellId);

        const day = splitCellId ? splitCellId[0] : null;
        const meal = splitCellId ? splitCellId[1] : null;
        console.log('Day:', day, 'Meal:', meal);
        const assignedUser = username;
        console.log(cellId);
        if (needToCook) {
            db.collection('households').doc(householdId).collection('weeks').doc(week).set({
                [`${day}.${meal}.description`]: description,
                [`${day}.${meal}.assignedUser`]: assignedUser,
                [`${day}.${meal}.needToCook`]: needToCook
            }, { merge: true });
            targetCell.textContent = assignedUser;
        } else {
            const data = {};
            data[`${day}.${meal}.description`] = firebase.firestore.FieldValue.delete();
            data[`${day}.${meal}.assignedUser`] = firebase.firestore.FieldValue.delete();
            data[`${day}.${meal}.needToCook`] = firebase.firestore.FieldValue.delete();

            db.collection('households').doc(householdId).collection('weeks').doc(week)
                .set(data, { merge: true })
                .then(() => {
                    console.log('Felder gelöscht');
                    targetCell.textContent = '';
                })
                .catch((error) => {
                    console.error('Fehler beim Löschen:', error);
                });
        }

    });

    function fetchAndFilterDataForCooking() {
        const week = getCurrentWeek(n);
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

                        db.collection('households')
                            .doc(householdId)
                            .get()
                            .then((doc) => {
                                if (doc.exists) {
                                    const userData = doc.data();
                                    const usersCustom = userData['users-custom'] || {}; // Fetch the 'users-custom' field
                                    // Get the color for the current user
                                    let currentUserColor = usersCustom[assignedUser]?.color || '';
                                    cell.style.color = currentUserColor;
                                    currentUserColor = usersCustom[username]?.color || '';
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
        });
    }

    // Call the function to fetch tasks for the current week
    fetchAndFilterDataForCooking();
    setInterval(fetchAndFilterDataForCooking, 5000);

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
        fetchAndFilterDataForCooking();
    });
    document.getElementById('dialog-close2').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog2').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
    });
    document.getElementById('dialog-close3').addEventListener('click', () => {
        // Hide the dialog box
        document.getElementById('dialog3').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
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
        fetchAndFilterDataForCooking();
    });

    nextWeekBtn.addEventListener('click', () => {
        n++;
        currentWeekElement.textContent = getWeekRange(n);
        fetchAndFilterDataForCooking();
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
        fetchAndFilterDataForCooking();
    });


    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn !== 'true') {
      // Redirect to the welcome page if the user is not logged in
      window.location.href = 'welcome.html';
    }

});