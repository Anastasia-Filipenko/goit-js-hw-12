import axios from 'axios';

import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const form = document.querySelector('.form');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.loader');
const loadMoreBtn = document.querySelector('.load_more_button');

function showLoader() {
  loader.style.display = 'flex';
}

function hideLoader() {
  loader.style.display = 'none';
}

function showLoadMoreBtn() {
  loadMoreBtn.style.display = 'flex';
}
function hideLoadMoreBtn() {
  loadMoreBtn.style.display = 'none';
}

hideLoadMoreBtn();
hideLoader();

const getGalleryCardHeight = () => {
  const galleryCard = document.querySelector('.gallery_list');
  const cardHeight = galleryCard.getBoundingClientRect().height;
  return cardHeight;
};

const smoothScroll = () => {
  const cardHeight = getGalleryCardHeight();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
};

const getImages = async params => {
  try {
    const response = await axios.get(
      `https://pixabay.com/api/?key=32445891-4e5aca6c6794ec22921e6fc5b`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

const createRequest = q => {
  let page = 1;
  const per_page = 40;
  let isLastPage = false;

  return async () => {
    try {
      if (isLastPage) return;

      const { hits, totalHits } = await getImages({
        q,
        page,
        per_page,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: true,
      });
      showLoadMoreBtn();
      if (page >= totalHits / per_page) {
        hideLoadMoreBtn();
        isLastPage = true;
        iziToast.warning({
          message: "We're sorry, but you've reached the end of search results.",
          position: 'topRight',
        });
      }

      page += 1;
      return hits;
    } catch (error) {
      console.log(error);
    }
  };
};

const galleryLightbox = new SimpleLightbox('.gallery_list a', {
  captions: true,
  captionType: 'attr',
  captionsData: 'alt',
  captionPosition: 'bottom',
  captionDelay: 250,
});

function render(images) {
  const markup = images.reduce(
    (
      html,
      { webformatURL, largeImageURL, tags, likes, views, comments, downloads }
    ) =>
      html +
      `
         <li class='gallery_list'>
          <a href="${largeImageURL}"><img class='gallery_img'src="${webformatURL}" alt="${tags}" /></a>
          <p class='gallery_info'>Likes <span>${likes}</span></p>
          <p class='gallery_info'>Views <span>${views}</span></p>
          <p class='gallery_info'>Comments <span>${comments}</span></p>
          <p class='gallery_info'>Downloads <span>${downloads}</span></p>
        </li>`,
    ''
  );

  gallery.insertAdjacentHTML('beforeend', markup);

  galleryLightbox.refresh();
}

let fetch = null;

form.addEventListener('submit', async e => {
  e.preventDefault();

  if (fetch != null) loadMoreBtn.removeEventListener('click', fetch);

  const inputValue = form.querySelector('.form_input').value;

  gallery.innerHTML = '';

  const fetchImage = createRequest(inputValue);

  let isFirstLoad = true;

  fetch = async () => {
    showLoader();
    const hits = await fetchImage();
    render(hits);
    hideLoader();

    if (!isFirstLoad) {
      smoothScroll();
    }

    isFirstLoad = false;
  };

  await fetch();

  loadMoreBtn.addEventListener('click', fetch);
});
