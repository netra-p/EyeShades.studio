/**
 * ============================================================================
 * THE EYESHADES STUDIO - INTERACTIVE CONTROLLER (app.js)
 * ============================================================================
 */

(function() {
  'use strict';

  // Application State
  const state = {
    artworks: [],
    activeCategory: 'All Portraits',
    currentLightboxIndex: 0,
    uploadedReferences: [],
    commissionForm: {
      basePrice: 750,
      tierName: 'A3 Detailed Solo Portrait',
      isFramed: false,
      isRush: false,
      shadingDepth: 'pure-graphite',
      totalEstimate: 750
    }
  };

  // DOM References
  let DOM = {};

  function initDOM() {
    DOM = {
      galleryGrid: document.getElementById('portraitGalleryGrid'),
      filterTabs: document.getElementById('filterTabs'),
      // Lightbox Modal
      lightbox: document.getElementById('lightboxModal'),
      lightboxImage: document.getElementById('lightboxImage'),
      lightboxImageWrap: document.getElementById('lightboxImageWrap'),
      lightboxCategory: document.getElementById('lightboxCategory'),
      lightboxTitle: document.getElementById('lightboxTitle'),
      lightboxSignature: document.getElementById('lightboxSignature'),
      lightboxLore: document.getElementById('lightboxLore'),
      lightboxMedium: document.getElementById('lightboxMedium'),
      lightboxPaper: document.getElementById('lightboxPaper'),
      lightboxDimensions: document.getElementById('lightboxDimensions'),
      lightboxHours: document.getElementById('lightboxHours'),
      lightboxTools: document.getElementById('lightboxTools'),
      lightboxPrice: document.getElementById('lightboxPrice'),
      lightboxCloseBtn: document.getElementById('lightboxCloseBtn'),
      lightboxPrevBtn: document.getElementById('lightboxPrevBtn'),
      lightboxNextBtn: document.getElementById('lightboxNextBtn'),
      lightboxLikeBtn: document.getElementById('lightboxLikeBtn'),
      lightboxLikeCount: document.getElementById('lightboxLikeCount'),
      // Commission Form
      commissionForm: document.getElementById('commissionForm'),
      tierCards: document.querySelectorAll('.portrait-tier-card'),
      framingToggle: document.getElementById('framingToggle'),
      rushToggle: document.getElementById('rushToggle'),
      shadingDepthSelect: document.getElementById('shadingDepthSelect'),
      estimatorPriceDisplay: document.getElementById('estimatorPriceDisplay'),
      estimatorBreakdownDisplay: document.getElementById('estimatorBreakdownDisplay'),
      dropzone: document.getElementById('photoDropzone'),
      fileInput: document.getElementById('referenceFileInput'),
      previewStrip: document.getElementById('previewStrip'),
      submitBtn: document.getElementById('btnSubmitPortrait'),
      // Success Modal
      successModal: document.getElementById('successModal'),
      successTrackingCode: document.getElementById('successTrackingCode'),
      successCloseBtn: document.getElementById('successCloseBtn'),
      // Order Status Lookup (customer can only see their own order)
      queueSearchInput: document.getElementById('queueSearchInput'),
      queueSearchBtn: document.getElementById('queueSearchBtn'),
      queueSearchResult: document.getElementById('queueSearchResult'),
      toastContainer: document.getElementById('toastContainer')
    };
  }

  function showToast(message, isError = false) {
    if (!DOM.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'studio-toast';
    toast.innerHTML = `
      <span>${isError ? '⚠️' : '✏️'}</span>
      <span>${message}</span>
    `;
    DOM.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /**
   * Render Portrait Gallery
   */
  async function loadGallery(category = 'All Portraits') {
    if (!DOM.galleryGrid) return;
    
    try {
      state.artworks = await window.EyeShadesAPI.fetchArtworks(category);
      renderGallery(state.artworks);
    } catch (err) {
      DOM.galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border: var(--border-pencil);">
          <p style="color: var(--accent-amber); font-weight: 700;">Loading error: ${err.message}</p>
        </div>
      `;
    }
  }

  function renderGallery(artworks) {
    DOM.galleryGrid.innerHTML = '';

    if (!artworks || artworks.length === 0) {
      DOM.galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: #fff; border: var(--border-pencil);">
          <p style="font-family: var(--font-brand); font-size: 1.2rem;">No portraits found under this category.</p>
        </div>
      `;
      return;
    }

    artworks.forEach((art, index) => {
      const card = document.createElement('article');
      card.className = 'portrait-art-card';
      card.setAttribute('data-id', art.id);
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View portrait: ${art.title}`);

      card.innerHTML = `
        <div class="card-image-holder">
          <img src="${art.thumbnail}" alt="${art.title}" class="card-sketch-img" loading="lazy" onerror="this.onerror=null; this.src='images/portrait_woman_rose.jpg';">
          <span class="card-category-badge">${art.category}</span>
        </div>

        <div class="card-meta-wrap">
          <h3 class="card-title">${art.title}</h3>
          <span class="card-signature">${art.signature}</span>
          
          <div class="card-footer-strip">
            <span style="font-weight: 800; color: var(--accent-ochre);">${art.price || 'From ₹550'}</span>
            <button class="card-like-btn" data-like-id="${art.id}" title="Appreciate sketch">
              🖤 <span>${art.likes}</span>
            </button>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.card-like-btn')) {
          e.stopPropagation();
          handleLikeClick(art.id, e.target.closest('.card-like-btn'));
          return;
        }
        openLightbox(index);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(index);
        }
      });

      DOM.galleryGrid.appendChild(card);
    });
  }

  async function handleLikeClick(artId, btnElement) {
    const span = btnElement.querySelector('span');
    const currentCount = parseInt(span.textContent, 10) || 0;
    span.textContent = currentCount + 1;
    btnElement.style.transform = 'scale(1.25)';
    setTimeout(() => {
      btnElement.style.transform = 'scale(1)';
    }, 200);

    try {
      const updated = await window.EyeShadesAPI.toggleLike(artId);
      span.textContent = updated.likes;
    } catch (err) {
      console.error('Failed to register appreciation:', err);
    }
  }

  function openLightbox(index) {
    state.currentLightboxIndex = index;
    const art = state.artworks[index];
    if (!art || !DOM.lightbox) return;

    DOM.lightboxImage.src = art.image;
    DOM.lightboxImage.alt = art.title;
    DOM.lightboxImageWrap.classList.remove('zoomed');

    DOM.lightboxCategory.textContent = art.category;
    DOM.lightboxTitle.textContent = art.title;
    DOM.lightboxSignature.textContent = art.signature;
    DOM.lightboxLore.textContent = `"${art.lore}"`;
    DOM.lightboxMedium.textContent = art.medium;
    DOM.lightboxPaper.textContent = art.paper || 'Premium Heavyweight Fine Art Sheet';
    DOM.lightboxDimensions.textContent = art.dimensions;
    DOM.lightboxHours.textContent = art.hoursInvested || '14-18 Hours';
    if (DOM.lightboxPrice) {
      DOM.lightboxPrice.textContent = art.price || '₹750 (Unframed)';
    }

    DOM.lightboxTools.innerHTML = (art.pencilsUsed || ['Graphite 2B-8B', 'Charcoal', 'Mono Zero Eraser']).map(pencil => `
      <span class="pencil-chip">${pencil}</span>
    `).join('');

    DOM.lightboxLikeCount.textContent = art.likes;
    DOM.lightboxLikeBtn.onclick = async () => {
      await handleLikeClick(art.id, DOM.lightboxLikeBtn);
      const updated = await window.EyeShadesAPI.getArtworkById(art.id);
      DOM.lightboxLikeCount.textContent = updated.likes;
    };

    DOM.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!DOM.lightbox) return;
    DOM.lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    let newIndex = state.currentLightboxIndex + direction;
    if (newIndex < 0) newIndex = state.artworks.length - 1;
    if (newIndex >= state.artworks.length) newIndex = 0;
    openLightbox(newIndex);
  }

  /**
   * Live Budget Calculation in Indian Rupees (₹500 - ₹1200 range)
   */
  function updateBudgetEstimate() {
    if (!DOM.estimatorPriceDisplay) return;

    const basePrices = {
      'tier-a4-solo': 550,
      'tier-a3-solo': 750,
      'tier-a3-couple': 950,
      'tier-a3-detailed': 1050
    };

    const selectedRadio = document.querySelector('input[name="portraitTier"]:checked');
    const tierValue = selectedRadio ? selectedRadio.value : 'tier-a3-solo';
    let base = basePrices[tierValue] || 750;

    let breakdown = [];
    breakdown.push(`Base Portrait: ₹${base}`);

    // Shading depth option
    if (DOM.shadingDepthSelect) {
      const depth = DOM.shadingDepthSelect.value;
      if (depth === 'charcoal-blend') {
        base += 50;
        breakdown.push('Charcoal Depth (+₹50)');
      } else if (depth === 'full-shadow-vignette') {
        base += 100;
        breakdown.push('Vignette Shading (+₹100)');
      }
    }

    // Framing Add-on: +₹200
    if (DOM.framingToggle && DOM.framingToggle.checked) {
      base += 200;
      breakdown.push('With Frame & Glass (+₹200)');
    } else {
      breakdown.push('Without Frame (₹0)');
    }

    // Rush Delivery (4-5 days): +₹100
    if (DOM.rushToggle && DOM.rushToggle.checked) {
      base += 100;
      breakdown.push('Priority Express (+₹100)');
    }

    state.commissionForm.totalEstimate = base;
    DOM.estimatorPriceDisplay.textContent = base;
    if (DOM.estimatorBreakdownDisplay) {
      DOM.estimatorBreakdownDisplay.textContent = breakdown.join(' | ');
    }
  }

  function setupTierCards() {
    DOM.tierCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.tierCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          state.commissionForm.tierName = card.querySelector('.tier-title').textContent;
          updateBudgetEstimate();
        }
      });
    });
  }

  function setupFileDropzone() {
    const dropzone = DOM.dropzone;
    const fileInput = DOM.fileInput;
    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      handleFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  function handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        showToast('Please upload reference image files (PNG, JPG, WebP)', true);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast('Photo size exceeds 10MB limit', true);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        state.uploadedReferences.push({
          name: file.name,
          url: event.target.result
        });
        renderPreviewThumbnails();
        showToast(`Reference photo "${file.name}" attached`);
      };
      reader.readAsDataURL(file);
    });
  }

  function renderPreviewThumbnails() {
    if (!DOM.previewStrip) return;
    DOM.previewStrip.innerHTML = '';
    state.uploadedReferences.forEach((item, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'thumb-preview-card';
      thumb.innerHTML = `
        <img src="${item.url}" alt="${item.name}">
        <button type="button" class="thumb-delete-btn" title="Remove photo">&times;</button>
      `;

      thumb.querySelector('.thumb-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        state.uploadedReferences.splice(index, 1);
        renderPreviewThumbnails();
      });

      DOM.previewStrip.appendChild(thumb);
    });
  }

  function setupCommissionForm() {
    if (!DOM.commissionForm) return;

    DOM.commissionForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const clientName = document.getElementById('clientName').value.trim();
      const clientEmail = document.getElementById('clientEmail').value.trim();
      const brief = document.getElementById('conceptBrief').value.trim();
      const selectedTierRadio = document.querySelector('input[name="portraitTier"]:checked');

      if (!clientName || !clientEmail) {
        showToast('Please enter your name and email address', true);
        return;
      }

      if (!brief || brief.length < 10) {
        showToast('Please describe the portrait subjects and special instructions (min 10 chars)', true);
        return;
      }

      const tierTitle = selectedTierRadio 
        ? selectedTierRadio.closest('.portrait-tier-card').querySelector('.tier-title').textContent 
        : 'A3 Detailed Solo Portrait';

      const isFramed = DOM.framingToggle && DOM.framingToggle.checked;

      const payload = {
        clientName,
        email: clientEmail,
        tierTitle,
        tierCode: selectedTierRadio?.value || 'tier-a3-solo',
        framingOption: isFramed ? 'With Wooden Frame & Glass' : 'Without Frame (Safe Roll Tube)',
        rushDelivery: DOM.rushToggle && DOM.rushToggle.checked,
        shadingDepth: DOM.shadingDepthSelect ? DOM.shadingDepthSelect.value : 'pure-graphite',
        estimatedBudget: state.commissionForm.totalEstimate || 750,
        brief,
        references: state.uploadedReferences.map(r => r.name)
      };

      DOM.submitBtn.disabled = true;
      DOM.submitBtn.textContent = 'REGISTERING COMMISSION...';

      try {
        const response = await window.EyeShadesAPI.submitCommission(payload);

        if (DOM.successTrackingCode) {
          DOM.successTrackingCode.textContent = `#${response.trackingCode}`;
        }
        if (DOM.successModal) {
          DOM.successModal.classList.add('active');
        }

        DOM.commissionForm.reset();
        state.uploadedReferences = [];
        renderPreviewThumbnails();
        const defaultTier = document.querySelector('.portrait-tier-card:nth-child(2)');
        if (defaultTier) defaultTier.click();
      } catch (err) {
        showToast(`Submission error: ${err.message}`, true);
      } finally {
        DOM.submitBtn.disabled = false;
        DOM.submitBtn.textContent = 'SUBMIT PORTRAIT COMMISSION AGREEMENT';
      }
    });
  }

  /**
   * Customer-facing order status lookup. Deliberately shows ONLY the fields
   * getCommissionByCode() returns — no other client's data is ever exposed here.
   */
  function setupQueueSearch() {
    if (!DOM.queueSearchBtn || !DOM.queueSearchInput) return;

    const statusCopy = {
      'Pending Review': { label: 'Awaiting Studio Review', note: 'Netra reviews new requests within 24 hours. Your price will be confirmed once accepted.' },
      'Accepted': { label: 'Accepted \u2014 In Queue', note: 'Your commission has been accepted and is queued to begin.' },
      'In Progress': { label: 'In Studio', note: 'Netra is actively working on your sketch.' },
      'Completed': { label: 'Completed', note: 'Your portrait is finished and ready for dispatch/pickup.' },
      'Rejected': { label: 'Not Accepted', note: 'The studio was unable to take on this commission. Please reach out for details.' }
    };

    const handleSearch = async () => {
      const query = DOM.queueSearchInput.value.trim();
      if (!query) {
        showToast('Please enter your tracking code (e.g., EYE-7821)', true);
        return;
      }

      DOM.queueSearchResult.innerHTML = `<p style="font-size: 0.85rem; color: #666;">Searching studio ledger...</p>`;

      try {
        const found = await window.EyeShadesAPI.getCommissionByCode(query);
        if (found) {
          const statusClass = found.status.toLowerCase().replace(/\s+/g, '-');
          const copy = statusCopy[found.status] || { label: found.status, note: '' };
          DOM.queueSearchResult.innerHTML = `
            <div style="background: #fff; border: var(--border-pencil); padding: 1.15rem; margin-top: 0.5rem; box-shadow: var(--shadow-studio-sm);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="font-family: var(--font-brand); font-size: 1.1rem; color: var(--accent-ochre);">#${found.id}</strong>
                <span class="status-chip ${statusClass}">${copy.label}</span>
              </div>
              <p style="font-size: 0.88rem; font-weight: 700;">${found.tier} &bull; ${found.price}</p>
              <p style="font-size: 0.8rem; color: #666; margin-top: 0.3rem;">${copy.note}</p>
              ${found.status !== 'Rejected' && found.status !== 'Pending Review' ? `
                <div class="progress-track" style="margin-top: 0.75rem;" title="${found.progress || 0}% Complete">
                  <div class="progress-bar-fill" style="width: ${found.progress || 0}%"></div>
                </div>
                <p style="font-size: 0.75rem; color: #666; margin-top: 0.3rem;">Est. Dispatch: ${found.estimatedDelivery}</p>
              ` : ''}
            </div>
          `;
        } else {
          DOM.queueSearchResult.innerHTML = `
            <p style="color: var(--accent-amber); font-size: 0.85rem; font-weight: 700; margin-top: 0.5rem;">
              No order found for tracking code "${query}". Double-check the code from your confirmation.
            </p>
          `;
        }
      } catch (err) {
        DOM.queueSearchResult.innerHTML = `<p style="color: red;">Error searching</p>`;
      }
    };

    DOM.queueSearchBtn.addEventListener('click', handleSearch);
    DOM.queueSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
    });
  }

  function setupFilters() {
    if (!DOM.filterTabs) return;
    DOM.filterTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-tab-btn');
      if (!btn) return;

      DOM.filterTabs.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');
      state.activeCategory = category;
      loadGallery(category);
    });
  }

  function setupGlobalEvents() {
    if (DOM.lightboxCloseBtn) DOM.lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (DOM.lightbox) {
      DOM.lightbox.addEventListener('click', (e) => {
        if (e.target === DOM.lightbox) closeLightbox();
      });
    }

    if (DOM.lightboxImageWrap) {
      DOM.lightboxImageWrap.addEventListener('click', () => {
        DOM.lightboxImageWrap.classList.toggle('zoomed');
      });
    }

    if (DOM.lightboxPrevBtn) DOM.lightboxPrevBtn.addEventListener('click', () => navigateLightbox(-1));
    if (DOM.lightboxNextBtn) DOM.lightboxNextBtn.addEventListener('click', () => navigateLightbox(1));

    if (DOM.successCloseBtn) {
      DOM.successCloseBtn.addEventListener('click', () => {
        DOM.successModal.classList.remove('active');
      });
    }
    if (DOM.successModal) {
      DOM.successModal.addEventListener('click', (e) => {
        if (e.target === DOM.successModal) {
          DOM.successModal.classList.remove('active');
        }
      });
    }

    if (DOM.framingToggle) DOM.framingToggle.addEventListener('change', updateBudgetEstimate);
    if (DOM.rushToggle) DOM.rushToggle.addEventListener('change', updateBudgetEstimate);
    if (DOM.shadingDepthSelect) DOM.shadingDepthSelect.addEventListener('change', updateBudgetEstimate);

    window.addEventListener('keydown', (e) => {
      if (DOM.lightbox && DOM.lightbox.classList.contains('active')) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'ArrowRight') navigateLightbox(1);
      } else if (DOM.successModal && DOM.successModal.classList.contains('active')) {
        if (e.key === 'Escape') DOM.successModal.classList.remove('active');
      }
    });
  }

  function bootstrap() {
    initDOM();
    setupFilters();
    loadGallery('All Portraits');
    setupTierCards();
    setupFileDropzone();
    setupCommissionForm();
    setupQueueSearch();
    setupGlobalEvents();
    updateBudgetEstimate();
    if (window.EyeShadesAPI && window.EyeShadesAPI.recordVisit) {
      window.EyeShadesAPI.recordVisit();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();