import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getFirestore, collection, updateDoc, arrayUnion, doc, onSnapshot, getDoc} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js"
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
        const db = getFirestore(app);
        // Reference to the Firestore collection "attendance"
        const attendanceCollectionRef = collection(db, 'attendance');
        //refreence to document containing presentStudents and otp
        const attendanceDocRef = doc(attendanceCollectionRef, 'Mkmqi6wwyzPYjvwNGLFm')


// JavaScript for form handling
const enrollmentNumberInput = document.getElementById('enrollmentNumber');
const otpInput = document.getElementById('otp');
const form = document.getElementById('attendanceForm');
const errorDiv = document.getElementById('error'); // New error div element
const countdownDisplay = document.getElementById('countdown');
const warningDisplay = document.getElementById('warning');
const alertDisplay = document.getElementById('alert')
let changedTab = localStorage.getItem('changedTab') ||false;
let markedAttendance = false;
let timeLeft = true;

form.addEventListener('submit',async function(event) {

  //Prevent the form from submitting initially
  event.preventDefault();

    // Checking if the enrollment number matches the required format (E23CSEU followed by 4 digits)
    const enrollmentPattern = /^E23CSEU\d{4}$/;
    if (!enrollmentPattern.test(enrollmentNumberInput.value)) {
        // Prevent the form from submitting
        event.preventDefault();

        // Display an error message in the "error" div
        displayErrorMessage('Enter 4 digits after "E23CSEU"');
        return;
    }


    // Check if the enrollment number is within the specified range
    const enrollmentNumber = parseInt(enrollmentNumberInput.value.slice(-4));
    if (enrollmentNumber < 960 || enrollmentNumber > 1201) {
        // Prevent the form from submitting
        event.preventDefault();

        // Display an error message in the "error" div
        displayErrorMessage('This enrollment number does not belong to this class');
      return
    }

    try {
      // Fetch the current OTP from Firestore
      const docSnapshot = await getDoc(attendanceDocRef);
      const data = docSnapshot.data();
      const otpFromFirestore = data.otp;

      // Get the OTP entered by the student
      const enteredOTP = otpInput.value;
    
    if (timeLeft) {
        if (!markedAttendance) {
            if (countdownTime > 0 && countdownTime <= 90) {                
                
                if (!changedTab) {
        
              // Check if the entered OTP matches the OTP from Firestore
                    if (enteredOTP === otpFromFirestore && enteredOTP !== '') {
                        // Add the enrollment number to the "presentStudents" array field
                        await updateDoc(attendanceDocRef, {
                            presentStudents: arrayUnion(enrollmentNumberInput.value),
                        });
        
                        // Clear the error message
                        errorDiv.textContent = '';
        
                        markedAttendance = true;
                        localStorage.setItem('markedAttendance', markedAttendance)
                        displayAlert('Attendance marked successfully');
                    } else {
    
                        displayErrorMessage('Incorrect OTP. Please try again.');
    
                    }
                } else {
                    //Error if user changed tabs
                    displayErrorMessage('Your attendance won\'t be marked as you had changed tabs.');
                }    
            } else {
                // Display an error message if the countdown is not runninng
                displayErrorMessage('Timer is not running. Please wait for the OTP.');
            }
        } else {
            //Error if attendance already marked
            displayErrorMessage('You have already marked attendance')
        }
    } else {
        displayErrorMessage("You were late, Attandance is over.")
    }
      
} catch (error) {
      console.error('Error adding enrollment number to Firestore:', error);
      // Handle any errors that occur during Firestore write
  }
});

//Countdown Code
let countdownTime = localStorage.getItem('countdownTime');

// Function to update the countdown display
function updateCountdown() {
    countdownDisplay.textContent = `Time remaining: ${countdownTime} seconds`;
    
    if (countdownTime <= 0) {
        clearInterval(countdownInterval);
        countdownDisplay.textContent = 'Countdown expired';
    } else {
        countdownTime--;
        localStorage.setItem('countdownTime', countdownTime);
    }
}

// Function to start the countdown timer
function startCountdown(timeElapsed) {
    countdownTime = 90 - timeElapsed; // Reset countdown time to 30 seconds
    countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
}
let countdownInterval;

//setting reload to false initially so that it doesnt run before the first attendance
let reload = false

//Listen for changes in the OTP field
try{
    onSnapshot(attendanceDocRef, (docSnapshot) => {
        const data = docSnapshot.data();
        const otp = data.otp;
        const timestamp = data.timestamp;
    
    
    
        // Check if OTP is not empty
        if (otp !== '' && timestamp !== '') {
            const currentTimestamp = Math.floor(Date.now() / 1000);
            const timeElapsed = currentTimestamp - timestamp

    
            if (timeElapsed <= 90) {
            startCountdown(timeElapsed);
            warningDisplay.textContent = 'Warning :- IF you minimize browser before marking attendance you wont be able to mark your attendance again.'
            document.addEventListener("visibilitychange", function () {
                if (document.hidden && !changedTab) {
                  changedTab = true;
                  localStorage.setItem('changedTab',changedTab)
                } else if (!document.hidden && changedTab) {
                  // Page is visible again after being hidden
                  displayAlert("You are back on the attendance page, but you won't be able to mark your attendance once you've left.");
                }
              });
    
              reload = true
            }else{
                timeLeft = false
            }
        } else {
            clearInterval(countdownInterval); // Stop the countdown if OTP is empty
            countdownDisplay.textContent = ''; // Clear the countdown display
    
            // Reset the countdown time when OTP is empty
            countdownTime = 90;
            // Or your desired initial countdown time
            localStorage.setItem('countdownTime', countdownTime);
    
            markedAttendance = false;
            localStorage.setItem('markedAttendance', markedAttendance);
    
            changedTab = false;
            localStorage.setItem('changedTab',changedTab);
    
            //if teacher resets attendance a 2nd time site reloads
            if (reload) {
                location.reload();
                reload = false
            }
        }
    });
} catch (error) {
    console.log("we got error", error);
}

function displayErrorMessage(message) {
    // Update the content of the "error" div with the error message
    errorDiv.textContent = message;
}

function displayAlert (message) {
    alertDisplay.textContent = message;
}

