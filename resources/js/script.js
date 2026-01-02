const libraryAPI =
  "https://script.google.com/macros/s/AKfycbzCaWbdybQRv1bC_dGP_8kQdEsaIK8WlxZArQwGue1dX2rw0Mus0HDVTC5BuziwJhmveg/exec";
const departmentAPI =
  "https://script.google.com/macros/s/AKfycbz7S5YB2NT7xVEd9xOvP_QiFnfsYhrS957WrNXOoSBeGrOpT-n4EZgxzF53oSxp97Y6/exec";
const courseAPI =
  "https://script.google.com/macros/s/AKfycbxDBRO9s78f_Pj0Q6QzDZPJHJegwx7GQf2_AgjBvkbcEuWcnWq5g0d97Oh9a40BQk4E3Q/exec";
const facilityAPI =
  "https://script.google.com/macros/s/AKfycbzGMYKtuKrYu6IzYHoAfA46domoRl6MjCNgUDJtrT2OFjHnfo0eB5TVmtk3jUEqJ0UWFQ/exec";
const bookingAPI =
  "https://script.google.com/macros/s/AKfycbxdkklPteUg-U0YP0YPorOU6cwTKnMGuNj9TW-BD9mw1BYVecwG96inpf29GZ4zo-dK/exec";
const bookingInsertAPI =
  "https://script.google.com/macros/s/AKfycbwlrbDe1Y9OOG1mrMvglSs4bnL2IWPb72eYxE9mqDstGAsZz8WzU_l-JxehJoGez_8a_Q/exec";

const selectLibraryType = document.getElementById("library");
const selectFacility = document.getElementById("facility");
const facilityGroup = document.getElementById("facilityGroup");
const noteMessage = document.getElementById("noteMessage");
const bookingNote = document.getElementById("bookingNote");
const submitBTN = document.getElementById("submitBTN");

const bookingNameVal = document.getElementById("booking_name");
const bookerTypeVal = document.getElementById("booker_type");
const emailVal = document.getElementById("email");
const numUsersVal = document.getElementById("num_users");
const nameUsersVal = document.getElementById("name_users");
const selectDepartment = document.getElementById("department");
const selectCourse = document.getElementById("course");
const yearLevelVal = document.getElementById("year_level");
// const sectionVal = document.getElementById("section");
const subjectTopicVal = document.getElementById("subject_topic_purpose");
const teacherCoordVal = document.getElementById("teacher_coordinator");

const nextBTN = document.getElementById("nextButton");
const bookingUserInfoDiv = document.getElementById("bookingUserInfo");
const timestamp = document.getElementById("timestamp");

let globalFacilityData = null;
let globalCourseData = null;
let globalDepartmentData = null;
let globalSelectedFacility = null;
let globalFetchBookings = null;
let globalValidationResult = null;
let globalLibraryData = null;
let globalSelectedLibrary = null;
let globalSelectedCourse = null;
let globalSelectedDepartment = null;

let pollingInterval = null;
let lastLibraryData = null;
let lastFacilityData = null;

function transformOption(elem, select) {
  const option = document.createElement("option");
  option.value = elem["id"];
  option.textContent = elem["name"];
  select.appendChild(option);
}

function addDefaultOption(message, select) {
  const option = document.createElement("option");
  option.value = "";
  option.textContent = message;
  option.disabled = true;
  option.selected = true;
  select.appendChild(option);
}

function addOptions(data, select) {
  data.forEach((elem) => {
    if (elem["status"] === "available") {
      transformOption(elem, select);
    } else {
      transformOption(elem, select);
    }
  });
}

function updateNextButtonState() {
  if (!nextBTN) return;

  // Get the actual input elements (the constants at top are the elements themselves)
  const bookingName = bookingNameVal?.value.trim();
  const bookerType = bookerTypeVal?.value.trim();
  const email = emailVal?.value.trim();
  const numUsers = numUsersVal?.value.trim();
  const nameUsers = nameUsersVal?.value.trim();
  const departmentVal = selectDepartment?.value;
  const courseVal = selectCourse?.value;
  const yearLevel = yearLevelVal?.value;
  // const section = sectionVal?.value.trim();
  const subjectTopic = subjectTopicVal?.value.trim();
  const teacherCoord = teacherCoordVal?.value.trim();
  const libraryVal = selectLibraryType?.value;

  // Check if facility group is visible
  const facilityVisible =
    facilityGroup &&
    (facilityGroup.style.visibility === "visible" ||
      getComputedStyle(facilityGroup).visibility === "visible");
  const facilityVal = selectFacility?.value;

  // All required fields must be filled
  let allFilled = !!(
    bookingName &&
    bookerType &&
    email &&
    numUsers &&
    nameUsers &&
    departmentVal &&
    courseVal &&
    yearLevel &&
    // section &&
    subjectTopic &&
    teacherCoord &&
    libraryVal
  );

  // If library is selected, facility must also be selected
  // (facility is always required when a library is chosen)
  if (libraryVal) {
    allFilled = allFilled && !!facilityVal;
  }

  // Check capacity validation if facility is selected and num_users has value
  if (allFilled && globalSelectedFacility && numUsers) {
    const numUsersInt = parseInt(numUsers);
    const capacity = parseInt(globalSelectedFacility.capacity);

    // Disable button if number of users exceeds capacity or is invalid
    if (numUsersInt <= 0 || numUsersInt > capacity) {
      allFilled = false;
    }
  }

  nextBTN.disabled = !allFilled;
}

// Real-time capacity check for the first form
function checkCapacityRealTime() {
  if (!globalSelectedFacility) return;

  const numUsersInput = document.getElementById("num_users");

  // If note message is visible, update it
  if (noteMessage && noteMessage.style.visibility === "visible") {
    // Remove any existing warning
    const existingWarning = noteMessage.querySelector(".capacity-warning");
    if (existingWarning) {
      existingWarning.remove();
    }

    // Check if there's a value to validate
    if (numUsersInput && numUsersInput.value) {
      const numUsers = parseInt(numUsersInput.value);
      const capacity = parseInt(globalSelectedFacility.capacity);

      // Add warning if exceeds capacity
      if (numUsers > capacity) {
        const warningParagraph = document.createElement("p");
        warningParagraph.className = "capacity-warning";
        warningParagraph.style.marginTop = "8px";
        warningParagraph.style.color = "#e74c3c";
        warningParagraph.style.fontWeight = "600";
        warningParagraph.innerHTML = `<strong>⚠️ Warning:</strong> Number of users (${numUsers}) exceeds capacity (${capacity})!`;
        noteMessage.appendChild(warningParagraph);
      } else if (numUsers > 0) {
        // Show success message when within capacity
        const successParagraph = document.createElement("p");
        successParagraph.className = "capacity-warning"; // Use same class for easy removal
        successParagraph.style.marginTop = "8px";
        successParagraph.style.color = "#27ae60";
        successParagraph.style.fontWeight = "600";
        successParagraph.innerHTML = `<strong>✓</strong> Number of users (${numUsers}) is within capacity.`;
        noteMessage.appendChild(successParagraph);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize button as disabled
  if (nextBTN) {
    nextBTN.disabled = true;
  }

  // Add listeners to all required fields
  if (bookingNameVal) {
    bookingNameVal.addEventListener("input", updateNextButtonState);
    bookingNameVal.addEventListener("change", updateNextButtonState);
  }

  if (bookerTypeVal) {
    bookerTypeVal.addEventListener("input", updateNextButtonState);
    bookerTypeVal.addEventListener("change", updateNextButtonState);
  }

  if (emailVal) {
    emailVal.addEventListener("input", updateNextButtonState);
    emailVal.addEventListener("change", updateNextButtonState);
  }

  if (numUsersVal) {
    numUsersVal.addEventListener("input", updateNextButtonState);
    numUsersVal.addEventListener("change", updateNextButtonState);
    // Add real-time capacity check
    numUsersVal.addEventListener("input", checkCapacityRealTime);
    numUsersVal.addEventListener("change", checkCapacityRealTime);
  }

  if (nameUsersVal) {
    nameUsersVal.addEventListener("input", updateNextButtonState);
    nameUsersVal.addEventListener("change", updateNextButtonState);
  }

  if (yearLevelVal) {
    yearLevelVal.addEventListener("input", updateNextButtonState);
    yearLevelVal.addEventListener("change", updateNextButtonState);
  }

  // if (sectionVal) {
  //   sectionVal.addEventListener("input", updateNextButtonState);
  //   sectionVal.addEventListener("change", updateNextButtonState);
  // }

  if (selectDepartment) {
    selectDepartment.addEventListener("change", updateNextButtonState);
  }

  if (selectCourse) {
    selectCourse.addEventListener("change", updateNextButtonState);
  }

  if (subjectTopicVal) {
    subjectTopicVal.addEventListener("input", updateNextButtonState);
    subjectTopicVal.addEventListener("change", updateNextButtonState);
  }

  if (teacherCoordVal) {
    teacherCoordVal.addEventListener("input", updateNextButtonState);
    teacherCoordVal.addEventListener("change", updateNextButtonState);
  }

  if (selectLibraryType) {
    selectLibraryType.addEventListener("change", updateNextButtonState);
  }

  if (selectFacility) {
    selectFacility.addEventListener("change", updateNextButtonState);
  }

  // Initial state check
  updateNextButtonState();
});

function onClickNextBTN() {
  bookingUserInfoDiv.style.display = "none";
  bookingUserInfoDiv.style.visibility = "hidden";

  // timestamp div visible
  timestamp.style.display = "block";
  timestamp.style.visibility = "visible";
}

function onClickBackBTN() {
  // Hide timestamp section
  timestamp.style.display = "none";
  timestamp.style.visibility = "hidden";

  // Show booking user info section
  bookingUserInfoDiv.style.display = "block";
  bookingUserInfoDiv.style.visibility = "visible";

  // Clear booking note message
  if (bookingNote) {
    bookingNote.innerHTML = "";
    bookingNote.style.visibility = "hidden";
  }
}

async function loadLibraries() {
  const currentSelection = selectLibraryType.value;

  const handleFetchDepartments = async () => {
    try {
      const response = await fetch(departmentAPI);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching libraries:", error);
      return [];
    }
  };

  const handleFetchLibraries = async () => {
    try {
      const response = await fetch(libraryAPI);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching libraries:", error);
      return [];
    }
  };

  const handleFetchBookings = async () => {
    try {
      const response = await fetch(bookingAPI);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching bookings:", error);
      return [];
    }
  };

  let fetchDepartments = await handleFetchDepartments();
  globalDepartmentData = fetchDepartments;

  selectDepartment.innerHTML = "";
  addDefaultOption("Please select a school department", selectDepartment);

  addOptions(fetchDepartments, selectDepartment);

  let fetchedBookings = await handleFetchBookings();
  globalFetchBookings = fetchedBookings;

  let fetchedLibraries = await handleFetchLibraries();
  globalLibraryData = fetchedLibraries; // Store library data globally

  selectLibraryType.innerHTML = "";
  addDefaultOption("Please select a library", selectLibraryType);

  addOptions(fetchedLibraries, selectLibraryType);

  // Restore selection after repopulating the dropdown
  if (currentSelection) {
    selectLibraryType.value = currentSelection;

    // If the previously selected library still exists
    if (selectLibraryType.value === currentSelection) {
      // Make sure facilities are still visible
      if (selectLibraryType.value) {
        facilityGroup.style.visibility = "visible";
      }
    }
  }
}

// onChange functionalities
function handleLibraryChange(selectElement) {
  const selectedValue = selectElement.value;

  if (!selectedValue) {
    facilityGroup.style.visibility = "hidden";
    globalSelectedLibrary = null;
    return;
  }

  // Store the selected library data
  if (globalLibraryData) {
    globalSelectedLibrary = globalLibraryData.find(
      (lib) => lib.id == selectedValue
    );
  }

  loadFacilities(selectedValue);
}

function handleDepartmentChange(selectElement) {
  const selectedValue = selectElement.value;

  if (globalSelectedDepartment) {
    globalSelectedCourse = globalSelectedCourse.find(
      (department) => department.id == selectedValue
    );
  }

  loadCourses(selectedValue);
}

// function handleCourseChange(selectElement) {

//     const selectedValue = selectElement.value;

//     if ( globalSelectedCourse ) {
//         globalSelectedCourse = globalSelectedCourse.find(course => course.id == selectedValue)
//         console.log('Selected Course', globalSelectedCourse);
//     }

//     loadCourses(selectedValue);
// }

// API callers
async function loadFacilities(libraryId) {
  const currentFacilityValue = selectFacility.value;

  const handleFetchFacilities = async () => {
    try {
      const response = await fetch(`${facilityAPI}?id=${libraryId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching facilities:", error);
      return [];
    }
  };

  let facilitiesData = await handleFetchFacilities();
  globalFacilityData = facilitiesData;

  selectFacility.innerHTML = "";
  addDefaultOption("Please select a facility", selectFacility);

  addOptions(facilitiesData, selectFacility);

  facilityGroup.style.visibility = "visible";

  // Restore facility selection if it still exists
  if (currentFacilityValue) {
    selectFacility.value = currentFacilityValue;
  }

  // Update button state after facility group becomes visible
  updateNextButtonState();
}

// async function loadDepartments(depratmentId) {
//     const currentDepartmentValue = selectDepartment.value;

//     const handleFetchDepartment = async () => {
//         try {
//             const response = await fetch(departmentAPI);
//             const data = await response.json();
//             console.log("departments:", data);
//             return data;
//         } catch (e) {
//             console.error(`Error fetching departments: ${e}`);
//             return [];
//         }
//     }

//     let departmentData = await handleFetchDepartment();
//     globalDepartmentData = departmentData

//     selectCourse.innerHTML = "";
//     addDefaultOption("Please select a facility", selectDepartment);

//     addOptions(departmentData, selectDepartment);

//     // Restore courses selection if it still exists
//     if (currentDepartmentValue) {
//         selectDepartment.value = currentDepartmentValue;
//     }
// }

async function loadCourses(departmentId) {
  const currentCourseValue = selectCourse.value;

  const handleFetchCourses = async () => {
    try {
      // Replace 'courseAPI' with your actual API endpoint for fetching courses by department
      const response = await fetch(`${courseAPI}?id=${departmentId}`);
      const data = await response.json();
      return data;
    } catch (e) {
      console.error(`Error fetching courses: ${e}`);
      return [];
    }
  };

  let coursesData = await handleFetchCourses();
  globalCourseData = coursesData;

  selectCourse.innerHTML = "";
  addDefaultOption("Please select a course", selectCourse);

  addOptions(coursesData, selectCourse);

  // Restore course selection if it still exists
  if (currentCourseValue) {
    selectCourse.value = currentCourseValue;
  }
}

function selectFacilityOnChange(facilityId) {
  const selectedFacilityId = facilityId.value;
  const selectedFacility = globalFacilityData.find(
    (facility) => facility["id"] == selectedFacilityId
  );

  globalSelectedFacility = selectedFacility;

  noteMessage.innerHTML = ""; // Clear previous message

  // Add facility hours info
  // const hoursParagraph = document.createElement('p');
  // hoursParagraph.textContent = `Note: The selected facility is only open at ${selectedFacility.open_range_time} and temporarily closed on ${selectedFacility.tem_close_time}.`;
  // noteMessage.appendChild(hoursParagraph);

  // Add capacity info
  const capacityParagraph = document.createElement("p");
  capacityParagraph.style.marginTop = "8px";
  capacityParagraph.innerHTML = `<strong>Capacity:</strong> Maximum ${selectedFacility.capacity} persons allowed.`;
  noteMessage.appendChild(capacityParagraph);

  noteMessage.style.visibility = "visible";

  // Trigger real-time capacity check to show dynamic warning/success message
  checkCapacityRealTime();

  // Check if date and time are already filled, then re-validate
  const dateInput = document.getElementById("date");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");

  if (dateInput.value && startTimeInput.value && endTimeInput.value) {
    triggerValidation();
  }
}

function selectDepartmentOnChange(departmentId) {
  const selectedDepartmentId = departmentId.value;
  const selectedDepartment = globaDepartmentData.find(
    (department) => department["id"] == selectedDepartmentId
  );

  globalSelectedFacility = selectedFacility;
}

// Real-time update for libraries
function checkLibraryUpdates() {
  fetch(libraryAPI)
    .then((res) => res.json())
    .then((data) => {
      const newData = JSON.stringify(data);

      // Only update if data changed
      if (lastLibraryData !== newData) {
        lastLibraryData = newData;
        loadLibraries();
      }
    })
    .catch((error) => console.error("Error checking library updates:", error));
}

// Real-time update for facilities (if a library is selected)
function checkFacilityUpdates() {
  const selectedLibrary = selectLibraryType.value;

  if (selectedLibrary && facilityGroup.style.visibility === "visible") {
    fetch(`${facilityAPI}?id=${selectedLibrary}`)
      .then((res) => res.json())
      .then((data) => {
        const newData = JSON.stringify(data);

        // Only update if data changed
        if (lastFacilityData !== newData) {
          lastFacilityData = newData;
          loadFacilities(selectedLibrary);
        }
      })
      .catch((error) =>
        console.error("Error checking facility updates:", error)
      );
  }
}

// Start real-time updates
function startRealTimeUpdates() {
  // Check for updates every 5 seconds
  pollingInterval = setInterval(() => {
    checkLibraryUpdates();
    checkFacilityUpdates();
  }, 5000); // 5000ms = 5 seconds
}

// Stop real-time updates
function stopRealTimeUpdates() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Smart polling - pause when tab is hidden
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopRealTimeUpdates();
  } else {
    checkLibraryUpdates(); // Check immediately
    checkFacilityUpdates(); // Check immediately
    startRealTimeUpdates(); // Resume polling
  }
});

// Initialize on page load
loadLibraries();
startRealTimeUpdates();

// Cleanup when page unloads
window.addEventListener("beforeunload", () => {
  stopRealTimeUpdates();
});

// ============================================
// BOOKING VALIDATION FUNCTIONS
// ============================================

// Convert 24-hour format to 12-hour format with AM/PM
function convertTo12Hour(timeStr) {
  if (!timeStr || timeStr.indexOf(":") === -1) return "";

  let [hours, minutes] = timeStr.split(":").map(Number);

  const period = hours >= 12 ? "PM" : "AM";

  // Convert hours from 24-hour to 12-hour format
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Convert 12-hour format with AM/PM to 24-hour format
function convertTo24Hour(timeStr) {
  // Handle edge cases
  if (!timeStr || !timeStr.includes(" ")) {
    console.error("Invalid time format:", timeStr);
    return "00:00"; // Default value
  }

  // Convert "9:00 AM" format to "09:00" format
  const [time, period] = timeStr.split(" ");

  if (!time || !period) {
    console.error("Failed to split time and period:", timeStr);
    return "00:00";
  }

  let [hours, minutes] = time.split(":").map(Number);

  if (isNaN(hours) || isNaN(minutes)) {
    console.error("Invalid hours or minutes:", hours, minutes);
    return "00:00";
  }

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const result = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  return result;
}

// Convert booking time format (handles "1:00:00 PM" format)
function convertBookingTimeFormat(timeStr) {
  if (!timeStr) return "";

  // Handle "1:00:00 PM" format - extract hours, minutes and period
  const timeMatch = timeStr.match(/(\d+):(\d+)(?::(\d+))?\s+([AP]M)/i);
  if (timeMatch) {
    let [_, hours, minutes, __, period] = timeMatch;
    hours = parseInt(hours);

    // Convert to 24-hour format
    if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  }

  return timeStr;
}

// Extract time from various formats (ISO, 12-hour, 24-hour)
function extractTimeFromAny(timeStr) {
  // Handle ISO date string format
  if (timeStr && timeStr.includes("T")) {
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) {
        // Use local time instead of UTC to avoid timezone issues
        return `${String(date.getHours()).padStart(2, "0")}:${String(
          date.getMinutes()
        ).padStart(2, "0")}`;
      }
    } catch (e) {
      console.error("Failed to parse ISO date:", timeStr);
    }
  }

  // Handle 12-hour clock format (1:00:00 PM)
  if (timeStr && (timeStr.includes("AM") || timeStr.includes("PM"))) {
    return convertBookingTimeFormat(timeStr);
  }

  // Already in 24h format or unknown format
  return timeStr;
}

// Normalize date format to YYYY-MM-DD
function normalizeDateFormat(dateStr) {
  if (!dateStr) return "";

  try {
    // Handle ISO datetime format (2025-10-19T16:00:00.000Z)
    if (dateStr.includes("T")) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Extract just the date part in local timezone
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }

    // Handle MM/DD/YYYY format
    if (dateStr.includes("/")) {
      const [month, day, year] = dateStr.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Already in YYYY-MM-DD format
    else if (dateStr.includes("-") && !dateStr.includes("T")) {
      return dateStr;
    }

    // Unknown format, try to parse as date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error("Error normalizing date:", e);
  }

  return dateStr; // Return original if we can't parse
}

// Convert time string to minutes since midnight for comparison
function convertTimeToMinutes(timeStr) {
  if (!timeStr || timeStr.indexOf(":") === -1) return 0;

  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Check if two time periods overlap
function isTimeOverlap(existingStart, existingEnd, newStart, newEnd) {
  // Convert all times to minutes since midnight for proper comparison
  const existingStartMinutes = convertTimeToMinutes(existingStart);
  const existingEndMinutes = convertTimeToMinutes(existingEnd);
  const newStartMinutes = convertTimeToMinutes(newStart);
  const newEndMinutes = convertTimeToMinutes(newEnd);

  // Check for overlap using numeric comparison
  // Two time periods overlap if: newStart < existingEnd AND newEnd > existingStart
  const hasOverlap =
    newStartMinutes < existingEndMinutes &&
    newEndMinutes > existingStartMinutes;

  return hasOverlap;
}

// Check if booking is within facility operating hours
function checkFacilityHours(date, startTime, endTime) {
  // Get the day of week for the selected date
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday

  let facilityHours;

  // Check if it's Sunday (0)
  if (dayOfWeek === 0) {
    return {
      valid: false,
      message:
        "This facility is not available on Sundays. Please select a different day.",
    };
  }
  // Check if it's Saturday (6)
  else if (dayOfWeek === 6) {
    // Check if facility has Saturday hours
    const saturdayHours = globalSelectedFacility.open_range_time_saturday;

    // If no Saturday hours or empty, facility is not available on Saturday
    if (!saturdayHours || saturdayHours.trim() === "") {
      return {
        valid: false,
        message:
          "This facility is not available on Saturdays. Please select a weekday.",
      };
    }

    facilityHours = saturdayHours;
  }
  // Weekday (Monday-Friday)
  else {
    facilityHours = globalSelectedFacility.open_range_time_weekdays;
  }

  // Validate facility hours format
  if (
    !facilityHours ||
    typeof facilityHours !== "string" ||
    !facilityHours.includes(" - ")
  ) {
    console.error("Invalid facility hours format:", facilityHours);
    return {
      valid: false,
      message:
        "Facility hours are not properly configured. Please contact the administrator.",
    };
  }

  // Example format: "9:00 AM - 5:00 PM"
  const parts = facilityHours.split(" - ");

  if (parts.length !== 2) {
    console.error("Failed to split facility hours:", facilityHours);
    return {
      valid: false,
      message:
        "Facility hours format is invalid. Please contact the administrator.",
    };
  }

  const facilityOpen = parts[0].trim();
  const facilityClose = parts[1].trim();

  // Convert to 24-hour format for comparison
  const facilityOpenTime = convertTo24Hour(facilityOpen);
  const facilityCloseTime = convertTo24Hour(facilityClose);

  if (startTime < facilityOpenTime) {
    return {
      valid: false,
      message: `Booking starts before facility opening time (${facilityOpen})`,
    };
  }

  if (endTime > facilityCloseTime) {
    return {
      valid: false,
      message: `Booking ends after facility closing time (${facilityClose})`,
    };
  }

  if (startTime >= endTime) {
    return {
      valid: false,
      message: "End time must be after start time",
    };
  }

  return { valid: true };
}

// Check if booking overlaps with temporary closure time
// Check if booking overlaps with temporary closure time
function checkTemporaryClosure(date, startTime, endTime) {
  // Parse temporary closure times
  const closureTimeRange = globalSelectedFacility.tem_close_time;

  // Skip check if no closure time is set or if it's invalid
  if (
    !closureTimeRange ||
    typeof closureTimeRange !== "string" ||
    !closureTimeRange.includes(" - ")
  ) {
    return { valid: true };
  }

  // Check for invalid "PM AM" or "AM PM" patterns in the time string
  if (
    closureTimeRange.includes("PM AM") ||
    closureTimeRange.includes("AM PM") ||
    closureTimeRange.includes("AM AM") ||
    closureTimeRange.includes("PM PM")
  ) {
    return { valid: true }; // Skip check if format is malformed
  }

  // Example: "10:00 AM - 1:00 PM"
  const parts = closureTimeRange.split(" - ");

  // Validate that we have exactly 2 parts
  if (parts.length !== 2) {
    return { valid: true };
  }

  const closureStart = parts[0].trim();
  const closureEnd = parts[1].trim();

  // Validate that both parts exist and have the expected format (time + space + AM/PM)
  if (
    !closureStart ||
    !closureEnd ||
    !closureStart.includes(" ") ||
    !closureEnd.includes(" ")
  ) {
    return { valid: true }; // Skip check if format is invalid
  }

  // Additional check: ensure each time has only ONE AM/PM marker
  const startAMPMCount = (closureStart.match(/AM|PM/gi) || []).length;
  const endAMPMCount = (closureEnd.match(/AM|PM/gi) || []).length;

  if (startAMPMCount !== 1 || endAMPMCount !== 1) {
    return { valid: true }; // Skip check if format is invalid
  }

  // Try to convert to 24-hour format - if this fails, skip the check
  try {
    const closureStartTime = convertTo24Hour(closureStart);
    const closureEndTime = convertTo24Hour(closureEnd);

    // Validate the conversion resulted in valid times
    if (
      !closureStartTime ||
      !closureEndTime ||
      closureStartTime === "00:00" ||
      closureEndTime === "00:00"
    ) {
      return { valid: true };
    }

    // Check if booking overlaps with closure time
    if (isTimeOverlap(closureStartTime, closureEndTime, startTime, endTime)) {
      return {
        valid: false,
        message: `Facility is temporarily closed from ${closureStart} to ${closureEnd}`,
      };
    }
  } catch (error) {
    console.error("Error processing closure times:", error);
    return { valid: true }; // Skip check on error
  }

  return { valid: true };
}

// Check for conflicts with existing bookings
function checkBookingConflicts(date, startTime, endTime) {
  if (!globalFetchBookings || !globalFetchBookings.length) {
    return { valid: true };
  }

  // Filter bookings for the same facility and date
  const conflictingBookings = globalFetchBookings.filter((booking) => {
    const facilityId = booking.facility_id;
    const bookingDate = booking.date;
    const bookingStartTime = booking.start_time;
    const bookingEndTime = booking.end_time;

    // Normalize dates for comparison (MM/DD/YYYY vs YYYY-MM-DD)
    const normalizedBookingDate = normalizeDateFormat(bookingDate);
    const normalizedInputDate = normalizeDateFormat(date);

    // Extract times from various formats
    const apiStartTime = extractTimeFromAny(bookingStartTime);
    const apiEndTime = extractTimeFromAny(bookingEndTime);

    // Convert to 12-hour format for display
    const apiStart12h = convertTo12Hour(apiStartTime);
    const apiEnd12h = convertTo12Hour(apiEndTime);
    const newStart12h = convertTo12Hour(startTime);
    const newEnd12h = convertTo12Hour(endTime);

    const sameFacility = facilityId == globalSelectedFacility.id;
    const sameDate = normalizedBookingDate === normalizedInputDate;
    const timeOverlaps = isTimeOverlap(
      apiStartTime,
      apiEndTime,
      startTime,
      endTime
    );

    return sameFacility && sameDate && timeOverlaps;
  });

  if (conflictingBookings.length > 0) {
    return {
      valid: false,
      message: `Time slot conflicts with existing booking(s)`,
    };
  }

  return { valid: true };
}

// Check if booking is on weekend and library allows weekend bookings
function checkWeekendAvailability(date) {
  if (!globalSelectedLibrary) {
    return { valid: true }; // If no library selected, skip check
  }

  // Parse the selected date
  const selectedDate = new Date(date);
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday

  // Check if selected date is Saturday (6) or Sunday (0)
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    // Check library's weekend_availability
    const weekendAvailable = globalSelectedLibrary.weekend_availability;

    if (weekendAvailable === "unavailable") {
      return {
        valid: false,
        message: `${globalSelectedLibrary.name} is not available on weekends. Please select a weekday.`,
      };
    }
  }

  return { valid: true };
}

// Check if number of users exceeds facility capacity
function checkFacilityCapacity() {
  if (!globalSelectedFacility) {
    return { valid: true }; // If no facility selected, skip check
  }

  // Get the number of users input
  const numUsersInput = document.getElementById("num_users");
  if (!numUsersInput || !numUsersInput.value) {
    return { valid: true }; // If no value entered, skip check
  }

  const numUsers = parseInt(numUsersInput.value);
  const facilityCapacity = parseInt(globalSelectedFacility.capacity);

  if (numUsers > facilityCapacity) {
    return {
      valid: false,
      message: `Number of users (${numUsers}) exceeds the capacity of ${globalSelectedFacility.name} (${facilityCapacity} persons). Please reduce the number of users or select a different facility.`,
    };
  }

  if (numUsers <= 0) {
    return {
      valid: false,
      message: `Number of users must be at least 1.`,
    };
  }

  return { valid: true };
}

// Main validation function
function validateBookingTime() {
  if (!globalSelectedFacility)
    return { valid: false, message: "Please select a facility first" };

  const dateInput = document.getElementById("date");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");

  if (!dateInput.value || !startTimeInput.value || !endTimeInput.value) {
    return { valid: false, message: "Please select date and time" };
  }

  // Parse inputs
  const selectedDate = dateInput.value;
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  // 1. Check facility capacity
  const capacityCheck = checkFacilityCapacity();
  if (!capacityCheck.valid) return capacityCheck;

  // 2. Check facility operating hours (includes weekend/weekday logic)
  const validHours = checkFacilityHours(selectedDate, startTime, endTime);
  if (!validHours.valid) return validHours;

  // 3. Check temporary closures
  const notClosed = checkTemporaryClosure(selectedDate, startTime, endTime);
  if (!notClosed.valid) return notClosed;

  // 4. Check for conflicts with existing bookings
  const noConflicts = checkBookingConflicts(selectedDate, startTime, endTime);
  if (!noConflicts.valid) return noConflicts;

  return { valid: true, message: "Booking time is available" };
}

// Refresh booking data from API
async function refreshBookingData() {
  try {
    const response = await fetch(bookingAPI);
    const data = await response.json();
    globalFetchBookings = data;
  } catch (error) {
    console.error("Error refreshing booking data:", error);
  }
}

// Global validation trigger function that can be called from anywhere
async function triggerValidation() {
  const dateInput = document.getElementById("date");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");

  // Refresh booking data first
  await refreshBookingData();

  // Only validate if all required fields are filled
  if (
    globalSelectedFacility &&
    dateInput.value &&
    startTimeInput.value &&
    endTimeInput.value
  ) {
    const result = validateBookingTime();

    // Display validation message
    bookingNote.innerHTML = "";
    const paragraph = document.createElement("p");

    // Format message with 12-hour times if it contains time values
    let message = result.message;

    // Convert any 24-hour times in the message to 12-hour format
    const timeRegex = /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b(?!\s*[AP]M)/gi;
    message = message.replace(timeRegex, (match) => convertTo12Hour(match));

    paragraph.textContent = message;

    if (!result.valid) {
      paragraph.style.color = "#e74c3c"; // Red for errors
    } else {
      paragraph.style.color = "#27ae60"; // Green for success
    }

    bookingNote.appendChild(paragraph);
    bookingNote.style.visibility = "visible";

    if (result.valid) {
      submitBTN.disabled = false;
    } else {
      submitBTN.disabled = true;
    }

    globalValidationResult = result.valid;
    return result.valid;
  } else {
    console.log("Validation skipped - missing required fields");
  }
  return false;
}

// Setup validation listeners
function setupValidationListeners() {
  const dateInput = document.getElementById("date");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");

  // Attach listeners to call the global triggerValidation function
  dateInput.addEventListener("change", triggerValidation);
  startTimeInput.addEventListener("change", triggerValidation);
  endTimeInput.addEventListener("change", triggerValidation);
}

// Initialize validation listeners after page loads
window.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - initializing validation");
  setupValidationListeners();
});

// Form submission handler with fetch API
document.querySelector("form").addEventListener("submit", async function (e) {
  e.preventDefault(); // Prevent default submission

  // Refresh booking data and validate before submission
  const isValid =
    globalValidationResult !== null
      ? globalValidationResult
      : await validateBookingTime();

  if (isValid) {
    // Show loading state
    submitBTN.disabled = true;
    submitBTN.value = "Submitting...";

    try {
      // Collect form data
      const formData = new FormData(this);
      const formDataObj = {};

      // Convert FormData to URL params (which works better with Google Apps Script)
      formData.forEach((value, key) => {
        // Handle multiple values for same key (like time inputs)
        if (formDataObj[key]) {
          if (!Array.isArray(formDataObj[key])) {
            formDataObj[key] = [formDataObj[key]];
          }
          formDataObj[key].push(value);
        } else {
          formDataObj[key] = value;
        }
      });

      // Add facility ID
      if (globalSelectedFacility) {
        formDataObj.facilityId = globalSelectedFacility.id;
      }

      // Build URL with query params for POST request
      const params = new URLSearchParams();
      Object.keys(formDataObj).forEach((key) => {
        if (Array.isArray(formDataObj[key])) {
          formDataObj[key].forEach((value) => {
            params.append(key, value);
          });
        } else {
          params.append(key, formDataObj[key]);
        }
      });

      console.log("Parameters:", params);

      // Send as POST request
      const response = await fetch(bookingInsertAPI, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      // Since we can't read response with no-cors, assume success
      const result = { success: true, reference: "BK" + Date.now() };

      if (result.success) {
        // Prepare receipt data object
        const receiptData = {
          ...formDataObj,
          reference: result.reference || "N/A",
          facilityName: globalSelectedFacility.name,
          libraryName: globalSelectedLibrary.name,
          bookingDate: new Date().toLocaleString(),
        };

        // Save to sessionStorage
        sessionStorage.setItem("bookingReceipt", JSON.stringify(receiptData));

        // Redirect to receipt page
        window.location.href = "receipt.html";
      } else {
        // Show error message
        bookingNote.innerHTML = `<p style='color: #e74c3c'>Booking failed: ${
          result.message || "Unknown error"
        }</p>`;
        submitBTN.disabled = false; // Allow retry
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      bookingNote.innerHTML =
        "<p style='color: #e74c3c'>Error submitting form. Please try again.</p>";
      submitBTN.disabled = false; // Allow retry
    } finally {
      bookingNote.style.visibility = "visible";
      submitBTN.value = "Submit"; // Reset button text
    }
  } else {
    console.log("Validation failed, form not submitted");
  }
});
