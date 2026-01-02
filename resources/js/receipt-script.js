const DEPARTMENT_API =
  "https://script.google.com/macros/s/AKfycbxJVR68FgXLOQU6hbxxhlK-8gWW7rQcwRBYV63DxeBZn4CUibJRYUYyPpstTRLrApms/exec";
const COURSE_API =
  "https://script.google.com/macros/s/AKfycbzUlxHy4R61ywdN6HUE8MFohHVy7AYQXogsLYA8x2_63JmTI5rVfs-nLl3IEkjok4ZQ/exec";

// Load receipt data from sessionStorage
window.addEventListener("DOMContentLoaded", () => {
  const receiptData = sessionStorage.getItem("bookingReceipt");

  console.log("Data:", receiptData);

  if (!receiptData) {
    alert("No receipt data found. Redirecting to booking page...");
    window.location.href = "index.html";
    return;
  }

  const data = JSON.parse(receiptData);

  // Convert 24-hour time to 12-hour format
  function convertTo12Hour(timeStr) {
    if (!timeStr || timeStr.indexOf(":") === -1) return "";

    let [hours, minutes] = timeStr.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";

    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // Format date
  const bookingDate = new Date(data.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startTime12h = convertTo12Hour(data.startTime);
  const endTime12h = convertTo12Hour(data.endTime);

  // Capitalize first letter of booker type
  const bookerTypeFormatted = data.booker_type
    ? data.booker_type.charAt(0).toUpperCase() + data.booker_type.slice(1)
    : "N/A";

  const handleFetchDepartmentAndCourse = async (departmentId, courseId) => {
    try {
      const [departmentRes, courseRes] = await Promise.all([
        fetch(`${DEPARTMENT_API}?id=${departmentId}`),
        fetch(`${COURSE_API}?id=${courseId}`),
      ]);
      const [departments, courses] = await Promise.all([
        departmentRes.json(),
        courseRes.json(),
      ]);
      return { departments, courses };
    } catch (e) {
      console.log(e);
      //   throw new Error("Error fetching department and resources:", e);
      return [];
    }
  };

  handleFetchDepartmentAndCourse(data.department, data.course).then(
    (result) => {
      console.log("Result:", result);
      // Populate receipt
      document.getElementById("referenceNumber").textContent = data.reference;
      document.getElementById("bookingName").textContent = data.booking_name;
      document.getElementById("bookerType").textContent = bookerTypeFormatted;
      document.getElementById("email").textContent = data.email || "N/A";
      document.getElementById("numUsers").textContent = data.num_users;
      document.getElementById("nameUsers").textContent = data.name_users;
      document.getElementById("department").textContent =
        result.departments[0].name;
      document.getElementById("course").textContent = result.courses[0].name;
      document.getElementById("section").textContent = data.section || "N/A";
      document.getElementById("yearLevel").textContent = data.year_level;
      document.getElementById("teacherCoordinator").textContent =
        data.teacher_coordinator;
      document.getElementById("purpose").textContent =
        data.subject_topic_purpose;
      document.getElementById("libraryName").textContent = data.libraryName;
      document.getElementById("facilityName").textContent = data.facilityName;
      document.getElementById("bookingDate").textContent = bookingDate;
      document.getElementById(
        "bookingTime"
      ).textContent = `${startTime12h} - ${endTime12h}`;
      document.getElementById("timestamp").textContent = data.bookingDate;
    }
  );
});

function goBackToBooking() {
  // Clear receipt data
  sessionStorage.removeItem("bookingReceipt");
  // Redirect to booking page
  window.location.href = "index.html";
}
