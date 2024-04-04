import * as Carousel from "./Carousel.mjs";


const breedSelect = document.getElementById("breedSelect");
const infoDump = document.getElementById("infoDump");
const progressBar = document.getElementById("progressBar");
const getFavouritesBtn = document.getElementById("getFavouritesBtn");

const API_KEY =
  "live_j4U9P1tus6pCJkgLvEvldbtR584RY9guwoBaWsISPBiaJnsuHHCzQaWaWGeRCW7W";

axios.defaults.baseURL = "https://api.thecatapi.com/v1";
axios.defaults.headers.common["x-api-key"] = API_KEY;

const initialLoad = async () => {
  try {
    const response = await axios.get("/breeds");
    response.data.forEach((breed) => {
      breedSelect.innerHTML += `<option value="${breed.id}">${breed.name}</option>`;
    });
    loadCarousel();
  } catch (error) {
    console.error("Error fetching breeds:", error);
  }
};

const loadCarousel = async () => {
  const breedId = breedSelect.value;
  try {
    const response = await axios.get(
      `/images/search?limit=25&breed_ids=${breedId}`,
      {
        onDownloadProgress: updateProgress,
      }
    );
    buildCarousel(response.data);
  } catch (error) {
    console.error("Error loading carousel:", error);
  }
};

const buildCarousel = (data, favourites) => {
  try {
    Carousel.clear();
    infoDump.innerHTML = "";
    data.forEach((item) => {
      Carousel.appendCarousel(
        Carousel.createCarouselItem(item.url, breedSelect.value, item.id)
      );
    });
    if (favourites) {
      infoDump.innerHTML = "Here are your saved favourites!";
    } else if (
      data.length > 0 &&
      data[0].breeds &&
      data[0].breeds[0].description
    ) {
      infoDump.innerHTML = data[0].breeds[0].description;
    } else {
      infoDump.innerHTML =
        "<div class='text-center'>No information on this breed, sorry!</div>";
    }
    Carousel.start();
  } catch (error) {
    console.error("Error building carousel:", error);
  }
};

breedSelect.addEventListener("change", loadCarousel);

axios.interceptors.request.use((config) => {
  progressBar.style.width = "0%";
  document.body.style.cursor = "progress";
  config.metadata = { startTime: new Date().getTime() };
  return config;
});

axios.interceptors.response.use(
  (response) => {
    response.config.metadata.endTime = new Date().getTime();
    response.config.metadata.durationInMS =
      response.config.metadata.endTime - response.config.metadata.startTime;
    console.log(
      `Request took ${response.config.metadata.durationInMS} milliseconds.`
    );
    document.body.style.cursor = "default";
    return response;
  },
  (error) => {
    error.config.metadata.endTime = new Date().getTime();
    error.config.metadata.durationInMS =
      error.config.metadata.endTime - error.config.metadata.startTime;
    console.log(
      `Request took ${error.config.metadata.durationInMS} milliseconds.`
    );
    document.body.style.cursor = "default";
    throw error;
  }
);

function updateProgress(progressEvent) {
  const percentage = Math.round(
    (progressEvent.loaded / progressEvent.total) * 100
  );
  progressBar.style.width = percentage + "%";
}

getFavouritesBtn.addEventListener("click", getFavourites);

async function getFavourites() {
  try {
    const favourites = await axios.get("/favourites");
    const formattedFavs = favourites.data.map((entry) => entry.image);
    buildCarousel(formattedFavs);
  } catch (error) {
    console.error("Error getting favourites:", error);
  }
}

export async function favourite(imgId) {
  try {
    const isFavorite = await axios.get(`/favourites?image_id=${imgId}`);
    if (isFavorite.data[0]) {
      await axios.delete(`/favourites/${isFavorite.data[0].id}`);
    } else {
      await axios.post("/favourites", { image_id: imgId });
    }
  } catch (error) {
    console.error("Error favouriting image:", error);
  }
}

initialLoad();
