// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAge5KBOpZZHB6UBClofy4M1-pJRhZItVc",
    authDomain: "kochplan-c7d15.firebaseapp.com",
    projectId: "kochplan-c7d15",
    storageBucket: "kochplan-c7d15.appspot.com",
    messagingSenderId: "811343664645",
    appId: "1:811343664645:web:09cb99d070bba357862e6c"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics(app);

// Initialize Firestore
const db = firebase.firestore(app);

// Get elements
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
// Get additional elements
const joinHouseholdDiv = document.getElementById('join-household');
const householdCodeInput = document.getElementById('household-code-input');
const joinBtn = document.getElementById('join-btn');
const selectUserDiv = document.getElementById('select-user');
const usersTable = document.getElementById('users-table');
const newUsernameInput = document.getElementById('new-username-input');
const createJoinUserBtn = document.getElementById('create-join-user-btn');

// Add event listener to create household button
createHouseholdBtn.addEventListener('click', () => {
    createHouseholdBtn.style.display = 'none';
    joinHouseholdBtn.style.display = 'none';
    createHouseholdDiv.style.display = 'block';
    createBackDiv.style.display = 'flex';
});

// Add event listener to household name input
householdNameInput.addEventListener('input', () => {
    nextBtn.disabled = !householdNameInput.value;
});

// Add event listener to next button
nextBtn.addEventListener('click', () => {
    createHouseholdDiv.style.display = 'none';
    createUserDiv.style.display = 'block';
});


function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}



function autoFill() {
    const sharedCode = getUrlParameter('code');
    if (sharedCode) {
        console.log(sharedCode);
        joinHouseholdBtn.click();

        householdCodeInput.value = sharedCode;
    }
}


window.onload(autoFill);

// Add event listener to join household button
joinHouseholdBtn.addEventListener('click', () => {
    createHouseholdBtn.style.display = 'none';
    joinHouseholdBtn.style.display = 'none';
    joinHouseholdDiv.style.display = 'block';
    createBackDiv.style.display = 'flex';
});

// Add event listener to household code input
householdCodeInput.addEventListener('input', () => {
    joinBtn.disabled = !householdCodeInput.value;
});

// Add event listener to username input
usernameInput.addEventListener('input', () => {
    createUserBtn.disabled = !usernameInput.value;
});

createBackBtn.addEventListener('click', () => {
    location.reload();
})

async function generateUniqueCode() {
    let istEizigartig = false;
    let code = '';

    while (!istEizigartig) {
        // Generate a random code
        code = Math.floor(Math.random() * 100000).toString();

        // Fetch all household documents once
        const codeFetch = await db.collection('households').get();

        let codeEinzigartig = true;
        codeFetch.forEach((doc) => {
            const codeFetched = doc.data().code;
            if (code === codeFetched) {
                codeEinzigartig = false;
                return; // Break out of the forEach loop if a matching code is found
            }
        });

        if (codeEinzigartig) {
            // The generated code is unique, exit the loop
            istEizigartig = true;
        }
    }

    return code;
}


// Add event listener to create user button
createUserBtn.addEventListener('click', async () => {
    // Generate a random code
    const code = await generateUniqueCode();
    // Create a new household in Firestore
    db.collection('households').add({
        name: householdNameInput.value,
        users: [usernameInput.value],
        code: code
    })
        .then((docRef) => {
            console.log(`Household created with ID: ${docRef.id}`);
            // Store the household ID and the username in the local storage
            localStorage.setItem('householdId', docRef.id);
            localStorage.setItem('username', usernameInput.value);
            // Redirect to the index.html page
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error(`Error adding document: ${error}`);
        });
});

// Add event listener to join button
joinBtn.addEventListener('click', () => {
    // Search for the household with the entered code in Firestore
    db.collection('households').where('code', '==', householdCodeInput.value).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // If the household is found, hide the join household div and display the select user div
                joinHouseholdDiv.style.display = 'none'; // Hide the join household div
                selectUserDiv.style.display = 'block'; // Display the select user div
                // Store the household ID in the local storage
                localStorage.setItem('householdId', querySnapshot.docs[0].id);
                // Display the existing users in the table
                const users = querySnapshot.docs[0].data().users;
                usersTable.innerHTML = users.map(user => `<tr><td>${user}</td></tr>`).join('');
            } else {
                console.error('No household found with the entered code');
            }
        })
        .catch((error) => {
            console.error(`Error getting documents: ${error}`);
        });
});

// Add event listener to new username input
newUsernameInput.addEventListener('input', () => {
    createJoinUserBtn.disabled = !newUsernameInput.value;
});

// Add event listener to users table
usersTable.addEventListener('click', (event) => {
    if (event.target.tagName === 'TD') {
        // If a td element was clicked, set the username in the local storage and redirect
        localStorage.setItem('username', event.target.textContent);
        window.location.href = 'index.html';
    }
});

// Add event listener to create and join user button
createJoinUserBtn.addEventListener('click', () => {
    // Add the new user to the household in Firestore
    const householdId = localStorage.getItem('householdId');
    db.collection('households').doc(householdId).update({
        users: firebase.firestore.FieldValue.arrayUnion(newUsernameInput.value)
    })
        .then(() => {
            console.log('User added to the household');
            // Store the username in the local storage
            localStorage.setItem('username', newUsernameInput.value);
            // Redirect to the index.html page
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error(`Error updating document: ${error}`);
        });






});