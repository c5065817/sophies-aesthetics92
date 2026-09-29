"use strict";

/*
Sources consulted:

Postcodes.io:
https://postcodes.io/docs/api/lookup-postcode/

GOV.UK Bank Holidays API:
https://www.gov.uk/bank-holidays.json

MDN Fetch API:
https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
*/


/* MOBILE NAVIGATION */

const navToggle =
    document.querySelector(".nav-toggle");

const primaryNavigation =
    document.querySelector("#primary-navigation");


navToggle.addEventListener("click", function () {

    const navigationIsOpen =
        primaryNavigation.classList.toggle("is-open");

    navToggle.setAttribute(
        "aria-expanded",
        navigationIsOpen.toString()
    );

    const hiddenText =
        navToggle.querySelector(".visually-hidden");

    hiddenText.textContent =
        navigationIsOpen
            ? "Close navigation"
            : "Open navigation";

});


const navigationLinks =
    primaryNavigation.querySelectorAll("a");


navigationLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        primaryNavigation.classList.remove("is-open");

        navToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        navToggle.querySelector(
            ".visually-hidden"
        ).textContent =
            "Open navigation";

    });

});


/* SERVICE DETAILS */

const serviceButtons =
    document.querySelectorAll(".service-toggle");


serviceButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        const controlledElementId =
            button.getAttribute("aria-controls");

        const details =
            document.getElementById(
                controlledElementId
            );

        const isCurrentlyExpanded =
            button.getAttribute(
                "aria-expanded"
            ) === "true";

        button.setAttribute(
            "aria-expanded",
            (!isCurrentlyExpanded).toString()
        );

        details.hidden =
            isCurrentlyExpanded;

        button.textContent =
            isCurrentlyExpanded
                ? "View details"
                : "Hide details";

    });

});


/* CONTACT METHOD */

const emailOption =
    document.querySelector("#contact-email");

const phoneOption =
    document.querySelector("#contact-phone");

const emailInput =
    document.querySelector("#email");

const telephoneInput =
    document.querySelector("#telephone");

const callbackContainer =
    document.querySelector("#callback-container");

const callbackTime =
    document.querySelector("#callback-time");


function updateContactMethod() {

    if (phoneOption.checked) {

        callbackContainer.hidden = false;

        telephoneInput.required = true;

        callbackTime.required = true;

        emailInput.required = false;

    } else {

        callbackContainer.hidden = true;

        emailInput.required = true;

        telephoneInput.required = false;

        callbackTime.required = false;

        callbackTime.value = "";

    }

}


emailOption.addEventListener(
    "change",
    updateContactMethod
);


phoneOption.addEventListener(
    "change",
    updateContactMethod
);


updateContactMethod();


/* POSTCODES.IO API */

const postcodeInput =
    document.querySelector("#postcode");

const postcodeButton =
    document.querySelector("#postcode-button");

const postcodeResult =
    document.querySelector("#postcode-result");


function setApiFeedback(
    element,
    message,
    state
) {

    element.textContent = message;

    if (state) {
        element.dataset.state = state;
    } else {
        delete element.dataset.state;
    }

}


postcodeButton.addEventListener(
    "click",
    lookupPostcode
);


postcodeInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            lookupPostcode();

        }

    }
);


async function lookupPostcode() {

    const postcode =
        postcodeInput.value.trim();


    if (postcode === "") {

        setApiFeedback(
            postcodeResult,
            "Please enter a UK postcode.",
            "error"
        );

        postcodeInput.focus();

        return;

    }


    setApiFeedback(
        postcodeResult,
        "Checking postcode…",
        "loading"
    );


    postcodeButton.disabled = true;


    try {

        const response =
            await fetch(
                "https://api.postcodes.io/postcodes/" +
                encodeURIComponent(postcode)
            );


        if (!response.ok) {

            throw new Error(
                "Postcode lookup failed."
            );

        }


        const data =
            await response.json();


        const location =
            data.result;


        const district =
            location.admin_district ||
            "District unavailable";


        const region =
            location.region ||
            location.country;


        postcodeInput.value =
            location.postcode;


        setApiFeedback(
            postcodeResult,
            `Location found: ${district}, ${region}, ${location.country}.`,
            "success"
        );


        console.log(
            "Postcodes.io response:",
            data
        );

    } catch (error) {

        setApiFeedback(
            postcodeResult,
            "Postcode could not be found. Please check it and try again.",
            "error"
        );


        console.error(
            "Postcode API error:",
            error
        );

    } finally {

        postcodeButton.disabled = false;

    }

}


/* GOV.UK BANK HOLIDAY API */

const consultationDate =
    document.querySelector("#consultation-date");

const dateResult =
    document.querySelector("#date-result");


let bankHolidayCache = null;


function getLocalDateString(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


consultationDate.min =
    getLocalDateString(
        new Date()
    );


consultationDate.addEventListener(
    "change",
    checkConsultationDate
);


async function getBankHolidays() {

    if (bankHolidayCache !== null) {

        return bankHolidayCache;

    }


    const response =
        await fetch(
            "https://www.gov.uk/bank-holidays.json"
        );


    if (!response.ok) {

        throw new Error(
            "Bank holiday request failed."
        );

    }


    const data =
        await response.json();


    bankHolidayCache =
        data["england-and-wales"].events;


    return bankHolidayCache;

}


async function checkConsultationDate() {

    const selectedDate =
        consultationDate.value;


    if (selectedDate === "") {

        setApiFeedback(
            dateResult,
            "",
            ""
        );

        return;

    }


    setApiFeedback(
        dateResult,
        "Checking selected date…",
        "loading"
    );


    try {

        const bankHolidays =
            await getBankHolidays();


        const bankHoliday =
            bankHolidays.find(
                function (holiday) {

                    return holiday.date ===
                        selectedDate;

                }
            );


        if (bankHoliday) {

            setApiFeedback(
                dateResult,
                `Please note: ${bankHoliday.title} is a bank holiday in England and Wales.`,
                "notice"
            );

        } else {

            setApiFeedback(
                dateResult,
                "No England and Wales bank holiday is listed for this date.",
                "success"
            );

        }


    } catch (error) {

        setApiFeedback(
            dateResult,
            "The bank holiday service is currently unavailable. You can still continue with the form.",
            "error"
        );


        console.error(
            "Bank holiday API error:",
            error
        );

    }

}


/* CHARACTER COUNTER */

const messageInput =
    document.querySelector("#message");

const characterCount =
    document.querySelector("#character-count");


messageInput.addEventListener(
    "input",
    function () {

        characterCount.textContent =
            messageInput.value.length;

    }
);


/* FORM SUBMISSION */

const consultationForm =
    document.querySelector(
        "#consultation-form"
    );

const formFeedback =
    document.querySelector(
        "#form-feedback"
    );


consultationForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();


        if (!consultationForm.checkValidity()) {

            consultationForm.reportValidity();

            formFeedback.textContent = "";

            return;

        }


        const submittedData =
            new FormData(
                consultationForm
            );


        const submittedName =
            submittedData.get("name");


        const treatmentInterest =
            submittedData.get(
                "treatment-interest"
            );


        formFeedback.textContent =
            `Thank you, ${submittedName}. Your demonstration request for "${formatInterest(treatmentInterest)}" has been processed within the application. No information has been transmitted or stored.`;


        formFeedback.focus();

    }
);


function formatInterest(value) {

    const labels = {

        "general-consultation":
            "General consultation",

        "aesthetic-treatment":
            "Aesthetic treatment",

        "aftercare":
            "Aftercare enquiry",

        "other":
            "Other"

    };


    return labels[value] || value;

}


consultationForm.addEventListener(
    "input",
    function () {

        formFeedback.textContent = "";

    }
);


/* COPYRIGHT YEAR */

const currentYear =
    document.querySelector(
        "#current-year"
    );


currentYear.textContent =
    new Date().getFullYear();
