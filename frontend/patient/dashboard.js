document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("diagnose-btn");
    const input = document.getElementById("symptoms");
    const resultBox = document.getElementById("diagnosis-result");

    btn.addEventListener("click", async () => {
        const symptoms = input.value.trim();
        if (!symptoms) {
            resultBox.style.display = "block";
            resultBox.innerHTML = "<p style='color:red;'>Please enter symptoms</p>";
            return;
        }

        try {
            // CALL PYTHON BACKEND API
            const res = await fetch("http://localhost:5000/diagnose", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ symptoms })
            });

            const data = await res.json();

            resultBox.style.display = "block";
            resultBox.innerHTML = `
                <h3>${data.diagnosis}</h3>
                <p><b>Identified Symptoms:</b> ${data.identified_symptoms.join(", ")}</p>
                <p><b>Confidence:</b> ${data.confidence}</p>
                <p><b>Recommendation:</b> ${data.recommendation || "—"}</p>
            `;
        } catch (err) {
            resultBox.style.display = "block";
            resultBox.innerHTML = "<p style='color:red;'>Error connecting to ML service.</p>";
        }
    });
});
