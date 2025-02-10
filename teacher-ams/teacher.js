import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, arrayUnion, onSnapshot, arrayRemove, getDoc} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"


        const firebaseConfig = {
            apiKey: "AIzaSyAr2F1gtdLCMVGbfvfUoY8z6wkUNP3wkzU",
            authDomain: "ams-bu.firebaseapp.com",
            projectId: "ams-bu",
            storageBucket: "ams-bu.appspot.com",
            messagingSenderId: "797609638153",
            appId: "1:797609638153:web:71b6234609df0c2f893bd8",
            measurementId: "G-TJJ1C97XYW"
        };
        const app = initializeApp(firebaseConfig);

        const attendanceList = document.getElementById('AttendanceList');
        const otp = document.getElementById("setOTP")
        const generateEl = document.getElementById("generateOTP")
        const resetButton = document.getElementById('resetAttendance');
        const alertDisplay = document.getElementById('alert');
        const countdownDisplay = document.getElementById('countdown');
        const addStudentButton = document.getElementById('addId')
        const enrollmentNumberInput = document.getElementById('enrollmentNumber')
        const downloadButton = document.getElementById('downloadButton');

      //Storing our database connection inside "db"
      const db =getFirestore()
      //Refrence to a specific collection in our database i.e Collection Refrence
      const colRef = collection(db, 'attendance') 
      //get collection data
      getDocs(colRef)
      //refreence to document containing presentStudents and Id
      const attendanceDocRef = doc(colRef, 'Mkmqi6wwyzPYjvwNGLFm')

  //Reset Button Functionality
  resetButton.addEventListener('click', async () => {
    try {
        // Query documents to reset field values
        const querySnapshot = await getDocs(colRef);

        querySnapshot.forEach(async(doc) => {
            // Update the document to reset field values
            await updateDoc(attendanceDocRef, {
              presentStudents: [],
              otp: '',
              timestamp: '',

          })
          location.reload();
        });

        otp.value = ""

        // provide feedback to the user
        displayAlert('Attendance reset successfully');

    } catch (error) {
        console.error('Error resetting attendance:', error);
        // Handle any errors
    }
});

addStudentButton.addEventListener('click', async function(event) {
  // Prevent the default behavior of the button
  event.preventDefault();
  const ENI = enrollmentNumberInput.value

  const enrollmentPattern = /^E23CSEU\d{4}$/;
    if (!enrollmentPattern.test(enrollmentNumberInput.value)) {
        // Prevent the form from submitting
        event.preventDefault();

        // Display an error message in the "error" div
        displayAlert('Enter 4 digits after "E23CSEU"');
        return;
    }


  const enrollmentNumber = parseInt(ENI.slice(-4));
    if (enrollmentNumber < 960 || enrollmentNumber > 1201) {
        // Prevent the form from submitting
        event.preventDefault();

        // Display an error message in the "error" div
        displayAlert('This enrollment number does not belong to this class');
      return
    }

  // directly add the student to the database from here
  try {
    await updateDoc(attendanceDocRef, {
      presentStudents: arrayUnion(ENI),
  });
      displayAlert( ENI + ' added to the database successfully.');
  } catch (error) {
      console.error('Error adding student to the database:', error);
      // Handle any errors 
  }
});


attendanceList.addEventListener('click', async (event) => {
  // Check if the clicked element is an <li> element
  if (event.target.tagName === 'LI') {
      // Fetch the enrollment number value from the clicked <li> element
      const enrollmentNumber = event.target.textContent;

      await updateDoc(attendanceDocRef, {
        presentStudents: arrayRemove(enrollmentNumber)
      })
      .then(() => {
        displayAlert(enrollmentNumber + ' removed successfully.');
    })
    .catch((error) => {
        console.error('Error removing enrollment number:', error);
    });
      
      // Now i can use the enrollmentNumber variable as needed
      console.log('Clicked enrollment number:', enrollmentNumber);
  }
});

async function fetchAndDisplayAttendance() {
  try {
      // Fetch the documents from the Firestore collection
      const querySnapshot = await getDocs(colRef);

      // Initialize an array to store enrollment numbers
      const enrollmentNumbers = [];

      // Iterate through the documents
      querySnapshot.forEach((doc) => {
          // Access the 'presentStudents' array field from each document
          const presentStudents = doc.data().presentStudents;

          // Add enrollment numbers to the array
          presentStudents.forEach((enrollmentNumber) => {
              enrollmentNumbers.push(enrollmentNumber);
          });
      });

      // Sort the enrollment numbers in ascending order
      enrollmentNumbers.sort();

      // Create list items and add them to the ordered list
      enrollmentNumbers.forEach((enrollmentNumber) => {
        const listItem = document.createElement('li');
        listItem.textContent = enrollmentNumber;
        attendanceList.appendChild(listItem);
    });
} catch (error) {
    console.error('Error fetching attendance data:', error);
}
}

// Call the function to fetch and display attendance data
fetchAndDisplayAttendance();

let reload = false;

// Generate OTP Button functionality
generateEl.addEventListener("click", function() {
  const teacherOTP = otp.value;

  if (teacherOTP === "") {
     displayAlert("Please provide an OTP");
     return;
  } else {
     const timestamp = Math.floor(Date.now() / 1000); // Get current timestamp in seconds

     // Create an object with OTP and timestamp
     const otpData = {
        otp: teacherOTP,
        timestamp: timestamp,
     };

     // Update Firestore with OTP and timestamp
     setDoc(attendanceDocRef, otpData, { merge: true })
        .then(() => {
           console.log('OTP and timestamp updated in Firestore');
           displayAlert('OTP Set: ' + teacherOTP);
        })
        .catch((error) => {
           console.error('Error updating OTP and timestamp in Firestore:', error);
        });

     reload = true;
  }
});


function displayAlert (message) {
  alertDisplay.textContent = message;
}

//Countdown Code
let countdownTime = localStorage.getItem('countdownTime') || 90;

// Function to update the countdown display
function updateCountdown() {
    countdownDisplay.textContent = `Time remaining: ${countdownTime} seconds`;
    
    if (countdownTime <= 0) {
        clearInterval(countdownInterval);
        countdownDisplay.textContent = 'Countdown expired';
        // Reload the current page after a delay of 3 seconds (3000 milliseconds)
        if (reload){
          setTimeout(function() {
            location.reload();
          }, 3000);
          reload = false
        }
      

    } else {
        countdownTime--;
        localStorage.setItem('countdownTime', countdownTime);
    }
}

// Function to start the countdown timer
function startCountdown() {
    countdownTime = localStorage.getItem('countdownTime') || 90; // Reset countdown time to 30 seconds
    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}
let countdownInterval;

//Listen for changes in the OTP field
onSnapshot(attendanceDocRef, (docSnapshot) => {
    const data = docSnapshot.data();
    const otp = data.otp;

    // Check if OTP is not empty
    if (otp !== '') {
        startCountdown();
    } else {
        clearInterval(countdownInterval); // Stop the countdown if OTP is empty
        countdownDisplay.textContent = ''; // Clear the countdown display

        // Reset the countdown time when OTP is empty
        countdownTime = 90;
        // Or your desired initial countdown time
        localStorage.setItem('countdownTime', countdownTime);
    }
})

// Get the current date
const today = new Date();

// Format the date as yyyy-mm-dd
const formattedDate = today.toISOString().slice(0, 10);

// Create the filename with today's date
const filename = `attendance-G5-${formattedDate}.csv`;



downloadButton.addEventListener('click', async () => {
  try {
      // Fetch the attendance data from Firestore
      const docSnapshot = await getDoc(attendanceDocRef);
      const presentStudents = docSnapshot.data().presentStudents || [];


      // Create an array to store the CSV rows
      const csvRows = [];

      // Add the CSV header row
      csvRows.push(['Email Id', 'Registration Id', 'Attendance*']);

      // Add data rows for each enrollment number
      for (const enrollmentNumber of presentStudents) {
        csvRows.push(['', enrollmentNumber, 'PRESENT']);
      }

      // Convert the CSV rows into a CSV string
      const csvContent = csvRows.map(row => row.join(',')).join('\n');

      // Create a Blob containing the CSV data
      const blob = new Blob([csvContent], { type: 'text/csv' });

      // Create a temporary URL for the Blob
      const blobURL = URL.createObjectURL(blob);

      // Create a hidden anchor element for initiating the download
      const a = document.createElement('a');
      a.href = blobURL;
      a.download = filename; // Set the filename for the download

      // Programmatically trigger a click event on the anchor element
      a.click();

      // Clean up the temporary URL
      URL.revokeObjectURL(blobURL);
  } catch (error) {
      console.error('Error downloading attendance CSV:', error);
  }
});
