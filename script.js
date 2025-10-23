//CHAVE DA API
const openWeatherApiKey = "a21398e56b7ccaa778ce7ffa9ea5729c";

//  ELEMENTOS
const locationInput = document.querySelector("#location-input");
const startDateInput = document.querySelector("#start-date-input");
const endDateInput = document.querySelector("#end-date-input");
const searchButton = document.querySelector("#search-button");
const resultsContainer = document.querySelector("#results-container");
const loadingMessage = document.querySelector("#loading-message");

// MAPAS DE DADOS
const stateImageMap = { "Acre": "acre.jpg", "Alagoas": "alagoas.jpg", "Amapá": "amapa.jpg", "Amazonas": "amazonas.jpg", "Bahia": "bahia.jpg", "Ceará": "ceara.jpg", "Distrito Federal": "distrito-federal.jpg", "Espírito Santo": "espirito-santo.jpg", "Goiás": "goias.jpg", "Maranhão": "maranhao.jpg", "Mato Grosso": "mato-grosso.jpg", "Mato Grosso do Sul": "mato-grosso-do-sul.jpg", "Minas Gerais": "minas-gerais.jpg", "Pará": "para.jpg", "Paraíba": "paraiba.jpg", "Paraná": "parana.jpg", "Pernambuco": "pernambuco.jpg", "Piauí": "piaui.jpg", "Rio de Janeiro": "rio-de-janeiro.jpg", "Rio Grande do Norte": "rio-grande-do-norte.jpg", "Rio Grande do Sul": "rio-grande-do-sul.jpg", "Rondônia": "rondonia.jpg", "Roraima": "roraima.jpg", "Santa Catarina": "santa-catarina.jpg", "São Paulo": "sao-paulo.jpg", "Sergipe": "sergipe.jpg", "Tocantins": "tocantins.jpg" };
const countryToContinentMap = { "US": "North America", "CA": "North America", "MX": "North America", "AR": "South America", "CO": "South America", "PE": "South America", "CL": "South America", "FR": "Europe", "DE": "Europe", "IT": "Europe", "GB": "Europe", "ES": "Europe", "PT": "Europe", "RU": "Europe", "JP": "Asia", "CN": "Asia", "IN": "Asia", "KR": "Asia", "ZA": "Africa", "EG": "Africa", "NG": "Africa", "KE": "Africa", "AU": "Oceania", "NZ": "Oceania" };
const continentImageMap = { "North America": "north-america.jpg", "South America": "south-america.jpg", "Europe": "europe.jpg", "Asia": "asia.jpg", "Africa": "africa.jpg", "Oceania": "oceania.jpg" };
const defaultCarouselImages = [ "default-world-1.jpg", "default-world-2.jpg", "default-world-3.jpg", "default-world-4.jpg" ];

//VARIAVEIS DE CONTROLE
let carouselInterval;
let currentCarouselIndex = 0;

// EVENTOS
searchButton.addEventListener("click", handleSearch);

const allInputFields = document.querySelectorAll("#location-input, #start-date-input, #end-date-input");

allInputFields.forEach(input => {
    input.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    });
});

// FUNÇÕES DE CONTROLE DO CARROSSEL
const stopCarousel = () => { if (carouselInterval) { clearInterval(carouselInterval); carouselInterval = null; } };
const startCarousel = () => {
    stopCarousel();
    document.body.style.backgroundImage = `url('images/${defaultCarouselImages[0]}')`;
    currentCarouselIndex = 0;
    carouselInterval = setInterval(() => {
        currentCarouselIndex = (currentCarouselIndex + 1) % defaultCarouselImages.length;
        document.body.style.backgroundImage = `url('images/${defaultCarouselImages[currentCarouselIndex]}')`;
    }, 7000);
};

//FUNÇÕES DE API
async function getCoordinatesForLocation(locationName) {
    const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${locationName}&appid=${openWeatherApiKey}`;
    const response = await fetch(apiURL);
    const data = await response.json();
    if (data.cod !== 200) { throw new Error(`Não foi possível encontrar "${locationName}". Verifique o nome.`); }
    return data.coord;
}
async function getLocationDetails(lat, lon) {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${openWeatherApiKey}`);
    const data = await response.json();
    if (data && data.length > 0) { return { state: data[0].state, country: data[0].country }; }
    return { state: null, country: null };
}
async function getWeatherForecast(latitude, longitude, startDate, endDate) {
    const apiURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const response = await fetch(apiURL);
    const data = await response.json();
    if (data.error) { throw new Error(`Erro da API de previsão: ${data.reason}`); }
    return data.daily;
}

//FUNÇÃO PRINCIPAL
async function handleSearch() {
    stopCarousel();
    const location = locationInput.value;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    if (!location) { alert("Por favor, digite o nome de um local para a viagem."); return; }
    if (startDate.length !== 10) { alert("Por favor, preencha a data de início no formato DD/MM/AAAA."); return; }
    if (endDate.length !== 10) { alert("Por favor, preencha a data de fim no formato DD/MM/AAAA."); return; }
    const formatToApiDate = (dateStr) => { const [day, month, year] = dateStr.split('/'); return `${year}-${month}-${day}`; };
    const apiStartDate = formatToApiDate(startDate);
    const apiEndDate = formatToApiDate(endDate);
    const startDateObj = new Date(apiStartDate + 'T00:00:00');
    const endDateObj = new Date(apiEndDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (endDateObj < startDateObj) { alert("A data de fim não pode ser anterior à data de início."); return; }
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 15);
    if (startDateObj > maxDate) { alert("A previsão só está disponível para os próximos 16 dias."); return; }
    loadingMessage.classList.remove("hide");
    resultsContainer.innerHTML = "";
    try {
        let locationToSearch = location;
        if (location.includes(",")) {
            const [city, state] = location.split(",").map(item => item.trim());
            locationToSearch = `${city},${state},BR`;
        }
        const coords = await getCoordinatesForLocation(locationToSearch);
        const locationDetails = await getLocationDetails(coords.lat, coords.lon);
        if (locationDetails.country === "BR" && locationDetails.state && stateImageMap[locationDetails.state]) {
            document.body.style.backgroundImage = `url('images/${stateImageMap[locationDetails.state]}')`;
        } else if (locationDetails.country && locationDetails.country !== "BR") {
            const continent = countryToContinentMap[locationDetails.country];
            if (continent && continentImageMap[continent]) {
                document.body.style.backgroundImage = `url('images/${continentImageMap[continent]}')`;
            } else {
                startCarousel();
            }
        } else {
            document.body.style.backgroundImage = `url('images/default-background.jpg')`;
        }
        const forecast = await getWeatherForecast(coords.lat, coords.lon, apiStartDate, apiEndDate);
        displayResults(forecast);
    } catch (error) {
        alert(error.message);
        document.body.style.backgroundImage = `url('images/default-background.jpg')`;
    } finally {
        loadingMessage.classList.add("hide");
    }
}

//FUNÇÕES DE RENDERIZAÇÃO
function displayResults(dailyData) {
    if (!dailyData || !dailyData.time || dailyData.time.length === 0) {
        resultsContainer.innerHTML = "<p>Nenhuma previsão encontrada para este período.</p>";
        return;
    }
    let html = "";
    dailyData.time.forEach((date, index) => {
        const day = {
            date: new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            icon: getIconForWeatherCode(dailyData.weathercode[index]),
            maxTemp: Math.round(dailyData.temperature_2m_max[index]),
            minTemp: Math.round(dailyData.temperature_2m_min[index])
        };
        html += `<div class="forecast-day"><div class="date">${day.date}</div><div class="icon">${day.icon}</div><div class="temps"><span class="max-temp">${day.maxTemp}°</span> / <span>${day.minTemp}°</span></div></div>`;
    });
    resultsContainer.innerHTML = html;
}
function getIconForWeatherCode(code) {
    switch (code) {
        case 0: return "☀️"; case 1: case 2: case 3: return "☁️"; case 45: case 48: return "🌫️"; case 51: case 53: case 55: return "🌧️"; case 61: case 63: case 65: return "🌧️"; case 66: case 67: return "❄️"; case 71: case 73: case 75: return "❄️"; case 80: case 81: case 82: return "🌦️"; case 85: case 86: return "🌨️"; case 95: case 96: case 99: return "⛈️"; default: return "❓";
    }
}

//LOGICA DOS INPUTS
const formatDateInput = (event) => {
    const input = event.target;
    let value = input.value.replace(/\D/g, "");
    if (value.length > 2) { value = `${value.slice(0, 2)}/${value.slice(2)}`; }
    if (value.length > 5) { value = `${value.slice(0, 5)}/${value.slice(5)}`; }
    input.value = value;
};
startDateInput.addEventListener("input", formatDateInput);
endDateInput.addEventListener("input", formatDateInput);
startDateInput.addEventListener("keyup", (event) => {
    if (event.target.value.length === 10) { endDateInput.focus(); }
});
const allInputs = document.querySelectorAll("#location-input, #start-date-input, #end-date-input");
allInputs.forEach(input => {
    const clearBtn = input.nextElementSibling;
    if (!clearBtn || !clearBtn.classList.contains('clear-btn')) return;
    const showOrHideClearBtn = () => { clearBtn.classList.toggle("hide", input.value.length === 0); };
    input.addEventListener("input", showOrHideClearBtn);
    clearBtn.addEventListener("click", () => {
        input.value = "";
        showOrHideClearBtn();
        input.focus();
    });
    showOrHideClearBtn();
});

//CALENDÁRIO FLATPICKR
document.addEventListener("DOMContentLoaded", function() {
    const config = {
        dateFormat: "d/m/Y",
        locale: "pt",
        allowInput: true,
    };
    flatpickr(startDateInput, config);
    flatpickr(endDateInput, config);
});