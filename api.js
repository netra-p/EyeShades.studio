/**
 * ============================================================================
 * THE EYESHADES STUDIO - FULL STACK API CLIENT & HYBRID DATA LAYER
 * ============================================================================
 * 
 * Auto-detects whether the Spring Boot backend is active.
 * - When Spring Boot is running: Communicates with REST endpoints + Database (H2 / PostgreSQL / Supabase).
 * - When standalone: Falls back gracefully to in-browser storage.
 * ============================================================================
 */

(function(window) {
  'use strict';

  const CONFIG = {
    // Dynamic base URL (works both locally and when deployed)
    API_BASE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
      ? 'http://localhost:8080/api/v1'
      : (window.location.origin.startsWith('http') ? `${window.location.origin}/api/v1` : 'http://localhost:8080/api/v1'),
    STORAGE_KEYS: {
      COMMISSIONS: 'eyeshades_portrait_commissions_v2',
      QUEUE: 'eyeshades_commission_queue_v3',
      LIKES: 'eyeshades_artwork_likes_v2',
      VISITS: 'eyeshades_site_visits_v1',
      ADMIN_SESSION: 'eyeshades_admin_session_v1'
    },
    // Demo-only client-side gate. This is NOT real security — anyone who reads
    // this file can see the password. Replace with Spring Security + a real
    // login endpoint before this ever goes properly live.
    ADMIN_PASSWORD: 'eyeshades-admin-2024'
  };

  /**
   * Order lifecycle. Netra (the studio) is the only one who moves an order
   * forward — the client only ever sees their own status via tracking code.
   */
  const ORDER_STATUS = {
    PENDING_REVIEW: 'Pending Review',
    ACCEPTED: 'Accepted',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    REJECTED: 'Rejected'
  };

  /**
   * Authentic Handcrafted Pencil Portrait Artworks by Netra Puranik
   */
  const FALLBACK_ARTWORKS = [
    {
      id: 'eye-001',
      title: 'Avneet Kaur',
      signature: '~ Netra A.P. (@the.eyepuranik)',
      category: 'Celebrity & Icons',
      medium: 'Graphite Pencil (2B, 4B, 6B, 8B) & Charcoal',
      paper: 'Ivory Smooth Fine Art Sheet (A3 Size)',
      pencilsUsed: ['Faber-Castell 9000 2B/4B/8B', 'Staedtler Mars Lumograph 6B', 'Mono Zero Precision Eraser', 'Paper Stump Blending'],
      dimensions: '11.7 x 16.5 in (A3)',
      hoursInvested: '18 Hours',
      year: '2024',
      price: '₹750 (Unframed) / ₹950 (Framed)',
      lore: 'An expressive, delicate portrait study exploring soft skin tonal gradients, silky hair flow, and realistic hand anatomy holding a blooming rose. Rendered with subtle graphite blending and crisp negative space highlights.',
      image: 'images/Avaneet Kaur.jpeg',
      thumbnail: 'images/Avaneet Kaur.jpeg',
      featured: true,
      likes: 428
    },
    {
      id: 'eye-002',
      title: 'ROHIT SHARMA ',
      signature: 'By: Netra Puranik',
      category: 'Detailed Graphite Studies',
      medium: 'High-Contrast Graphite & Deep Charcoal Shading',
      paper: 'Cartridge Heavyweight 220 GSM Sketch Sheet',
      pencilsUsed: ['Staedtler 4B/6B/8B', 'General Charcoal Pencil Soft', 'Tombow Mono Zero Eraser', 'Kneaded Eraser'],
      dimensions: '11.7 x 16.5 in (A3)',
      hoursInvested: '22 Hours',
      year: '2024',
      price: '₹750 (Unframed) / ₹950 (Framed)',
      lore: 'A powerful, intense portrait tribute to Indian cricket captain Rohit Sharma. Features intricate beard texture rendering, lifelike eye focus, realistic ear cartilage shading, and jersey collar depth.',
      image: 'images/Rohit Sharma.jpeg',
      thumbnail: 'images/Rohit Sharma.jpeg',
      featured: true,
      likes: 582
    },
    {
      id: 'eye-003',
      title: 'Avneet Kaur',
      signature: '~ Netra A.P. (@the.eyepuranik)',
      category: 'Female Portraits',
      medium: 'Soft Graphite Shading & Natural Light Depth',
      paper: 'Fine Grain Cold-Pressed 200 GSM Drawing Paper',
      pencilsUsed: ['Faber-Castell 2B/3B/6B', 'Soft Blending Tortillon', 'Mechanical Pencil 0.5 2B', 'White Highlight Pencil'],
      dimensions: '11.7 x 16.5 in (A3)',
      hoursInvested: '16 Hours',
      year: '2024',
      price: '₹750 (Unframed) / ₹950 (Framed)',
      lore: 'Capturing natural warmth, radiant smile curves, dense flowing hair texture, and traditional bindi detail under natural sunlight bokeh. Emphasizes soft volumetric facial contours.',
      image: 'images/Avneet Kaur.jpeg',
      thumbnail: 'images/Avneet Kaur.jpeg',
      featured: true,
      likes: 394
    },
    {
      id: 'eye-004',
      title: 'Wedding portrait',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Couple & Dual Portraits',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Dada Vahini1.jpeg',
      thumbnail: 'images/Dada Vahini1.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-005',
      title: 'Prarthana Behere',
      signature: '~ Netra A.P.',
      category: 'Celebrity & Icons',
      medium: 'Graphite Shading & Charcoal Contrast',
      paper: 'Heavyweight Drawing Sheet 220 GSM',
      pencilsUsed: ['Staedtler Mars Lumograph 2B-8B', 'Soft Charcoal', 'Mono Eraser'],
      dimensions: '11.7 x 16.5 in (A3)',
      hoursInvested: '24 Hours',
      year: '2024',
      price: '₹950 (Unframed) / ₹1,150 (Framed)',
      lore: 'Detailed two-person portrait composition specially suited for wedding memories, anniversaries, or parent gifts. Balanced lighting across both subjects.',
      image: 'images/Prarthana Behre.jpeg',
      thumbnail: 'images/Prarthana Behre.jpeg',
      featured: false,
      likes: 470
    },
    {
    id: 'eye-006',
    title: 'Lionel Messi',
    signature: 'By: Netra Puranik (@the.eyepuranik)',
    category: 'Detailed Graphite Studies',
    medium: 'Graphite & Charcoal Shading',
    paper: 'Heavyweight Fine Art Sheet (A3)',
    pencilsUsed: ['Faber-Castell 2B/4B/8B', 'Mono Zero Eraser', 'Blending Stump'],
    dimensions: '11.7 x 16.5 in (A3)',
    hoursInvested: '18 Hours',
    year: '2024',
    price: '₹750 (Unframed) / ₹950 (Framed)',
    lore: 'Nuanced graphite facial contours, intense gaze and beard cross-shading.',
    image: 'images/Lionel Messi.jpeg',
    thumbnail: 'images/Lionel Messi.jpeg',
    featured: true,
    likes: 210
    },
    {
      id: 'eye-007',
      title: 'Couple portrait',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Couple & Dual Portraits',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Dada Vahini2.jpeg',
      thumbnail: 'images/Dada Vahini2.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-008',
      title: 'Mrunal Thakur',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Celebrity & Icons',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Mrunal Thakur.jpeg',
      thumbnail: 'images/Mrunal Thakur.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-009',
      title: 'Mrunal Thakur',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Female Portraits',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Mrunaal Thakur.jpeg',
      thumbnail: 'images/Mrunaal Thakur.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0010',
      title: 'Prarthana Behere',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Female Portraits',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Prarthana Behere.jpeg',
      thumbnail: 'images/Prarthana behere.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0011',
      title: 'Seedhe Maut',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Celebrity & Icons',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Seedhe Maut.jpeg',
      thumbnail: 'images/Seedhe Maut.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0012',
      title: 'Seedhe Maut',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Couple & Dual Portraits',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Seedhe Mout.jpeg',
      thumbnail: 'images/Seedhe Mout.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0013',
      title: 'Personal Portrait',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Detailed Graphite Studies',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Dad.jpeg',
      thumbnail: 'images/Dad.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0014',
      title: 'Cafu',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Celebrity & Icons',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Cafu.jpeg',
      thumbnail: 'images/Cafu.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0015',
      title: 'Cafu',
      signature: 'By: Netra Puranik (@the.eyepuranik)',
      category: 'Detailed Graphite Studies',
      medium: 'Graphite HB, 2B, 4B on Archival Bristol Paper',
      paper: 'Strathmore 300 Series Bristol (A4 Size)',
      pencilsUsed: ['Faber-Castell 2B-6B', 'Blending Stumps', 'Mono Zero Eraser'],
      dimensions: '8.3 x 11.7 in (A4)',
      hoursInvested: '12 Hours',
      year: '2024',
      price: '₹550 (Unframed) / ₹750 (Framed)',
      lore: 'Delicate head and shoulder study focusing on realistic facial symmetry, natural eyelid folds, and soft skin blending for an elegant, timeless finish.',
      image: 'images/Caafu.jpeg',
      thumbnail: 'images/Caafu.jpeg',
      featured: false,
      likes: 312
    },
    {
      id: 'eye-0016',
      title: 'Elli AvrRam',
      signature: '~ Netra A.P. (@the.eyepuranik)',
      category: 'Celebrity & Icons',
      medium: 'Graphite Pencil (2B, 4B, 6B, 8B) & Charcoal',
      paper: 'Ivory Smooth Fine Art Sheet (A3 Size)',
      pencilsUsed: ['Faber-Castell 9000 2B/4B/8B', 'Staedtler Mars Lumograph 6B', 'Mono Zero Precision Eraser', 'Paper Stump Blending'],
      dimensions: '11.7 x 16.5 in (A3)',
      hoursInvested: '18 Hours',
      year: '2024',
      price: '₹750 (Unframed) / ₹950 (Framed)',
      lore: 'An expressive, delicate portrait study exploring soft skin tonal gradients, silky hair flow, and realistic hand anatomy holding a blooming rose. Rendered with subtle graphite blending and crisp negative space highlights.',
      image: 'images/Elliee Avaram.jpeg',
      thumbnail: 'images/Elliee Avaram.jpeg',
      featured: true,
      likes: 428
    }
  ];

  // Seed data so the admin dashboard isn't empty on first load. clientName here
  // is the FULL name (admin-only view) — the public tracking lookup masks it.
  const INITIAL_QUEUE = [
    {
      id: 'EYE-7820',
      clientName: 'Rahul & Priya Mehta',
      email: 'rahul.mehta@example.com',
      tier: 'A3 Couple / 2 Faces',
      estimatedBudget: 1150,
      finalPrice: 1150,
      framing: 'With Wooden Frame & Glass',
      brief: 'Anniversary portrait from our wedding reception photo.',
      status: ORDER_STATUS.IN_PROGRESS,
      progress: 75,
      estimatedDelivery: 'Sep 29, 2024',
      date: '2024-09-10'
    },
    {
      id: 'EYE-7821',
      clientName: 'Siddharth Kulkarni',
      email: 'siddharth.k@example.com',
      tier: 'A3 Detailed Solo',
      estimatedBudget: 750,
      finalPrice: 750,
      framing: 'Without Frame',
      brief: 'Focus on the eyes and natural smile, remove the background.',
      status: ORDER_STATUS.IN_PROGRESS,
      progress: 40,
      estimatedDelivery: 'Oct 03, 2024',
      date: '2024-09-15'
    },
    {
      id: 'EYE-7822',
      clientName: 'Ananya Sen',
      email: 'ananya.sen@example.com',
      tier: 'A4 Solo Portrait',
      estimatedBudget: 750,
      finalPrice: 750,
      framing: 'With Wooden Frame & Glass',
      brief: 'Birthday memorial sketch, please keep it warm and soft.',
      status: ORDER_STATUS.COMPLETED,
      progress: 100,
      estimatedDelivery: 'Sep 26, 2024',
      date: '2024-09-05'
    },
    {
      id: 'EYE-7823',
      clientName: 'Vikram Bhatia',
      email: 'vikram.b@example.com',
      tier: 'A4 Solo Portrait',
      estimatedBudget: 550,
      finalPrice: null,
      framing: 'Without Frame',
      brief: 'Head and shoulders sketch from a graduation photo.',
      status: ORDER_STATUS.PENDING_REVIEW,
      progress: 0,
      estimatedDelivery: null,
      date: '2024-09-20'
    }
  ];

  function initStorage() {
    try {
      if (!localStorage.getItem(CONFIG.STORAGE_KEYS.QUEUE)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.QUEUE, JSON.stringify(INITIAL_QUEUE));
      }
      if (!localStorage.getItem(CONFIG.STORAGE_KEYS.COMMISSIONS)) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.COMMISSIONS, JSON.stringify([]));
      }
      if (!localStorage.getItem(CONFIG.STORAGE_KEYS.LIKES)) {
        const initialLikes = {};
        FALLBACK_ARTWORKS.forEach(art => {
          initialLikes[art.id] = art.likes;
        });
        localStorage.setItem(CONFIG.STORAGE_KEYS.LIKES, JSON.stringify(initialLikes));
      }
    } catch (e) {}
  }

  initStorage();

  const EyeShadesAPI = {
    /**
     * Fetch artworks from Spring Boot REST endpoint with fallback
     */
    async fetchArtworks(category = 'All Portraits') {
      try {
        const url = new URL(`${CONFIG.API_BASE_URL}/portraits`);
        if (category && category !== 'All Portraits') {
          url.searchParams.append('category', category);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(url.toString(), { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            return data;
          }
        }
      } catch (backendError) {
        console.info('Using local cache for artworks (Spring Boot offline or direct file access)');
      }

      // Local fallback
      let likesMap = {};
      try {
        likesMap = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.LIKES) || '{}');
      } catch (e) {}

      let list = FALLBACK_ARTWORKS.map(art => ({
        ...art,
        likes: likesMap[art.id] !== undefined ? likesMap[art.id] : art.likes
      }));

      if (category && category !== 'All Portraits') {
        list = list.filter(art => art.category.toLowerCase() === category.toLowerCase());
      }
      return list;
    },

    /**
     * Fetch single artwork
     */
    async getArtworkById(id) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/portraits/${id}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}

      const artwork = FALLBACK_ARTWORKS.find(a => a.id === id);
      return artwork || null;
    },

    /**
     * Upvote/Like Artwork
     */
    async toggleLike(id) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/portraits/${id}/like`, { method: 'POST' });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}

      let likesMap = {};
      try {
        likesMap = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.LIKES) || '{}');
      } catch (e) {}

      const current = likesMap[id] !== undefined ? likesMap[id] : (FALLBACK_ARTWORKS.find(a => a.id === id)?.likes || 0);
      const updated = current + 1;
      likesMap[id] = updated;
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.LIKES, JSON.stringify(likesMap));
      } catch (e) {}
      return { id, likes: updated };
    },

    /**
     * Submit Commission to Database
     */
    async submitCommission(commissionData) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/commissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(commissionData)
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (backendError) {
        console.info('Saving commission locally (Spring Boot offline)');
      }

      // Local fallback handler — order starts as PENDING REVIEW.
      // Netra must accept it in the admin dashboard before it enters production.
      const trackingCode = `EYE-${Math.floor(1000 + Math.random() * 9000)}`;
      const newCommission = {
        id: trackingCode,
        ...commissionData,
        status: ORDER_STATUS.PENDING_REVIEW,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        progress: 0,
        finalPrice: null,
        estimatedDelivery: null
      };

      try {
        const userCommissions = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.COMMISSIONS) || '[]');
        userCommissions.unshift(newCommission);
        localStorage.setItem(CONFIG.STORAGE_KEYS.COMMISSIONS, JSON.stringify(userCommissions));

        const queue = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.QUEUE) || JSON.stringify(INITIAL_QUEUE));
        queue.unshift({
          id: trackingCode,
          clientName: newCommission.clientName,
          email: newCommission.email,
          tier: newCommission.tierTitle || 'Custom Portrait',
          estimatedBudget: newCommission.estimatedBudget,
          finalPrice: null,
          framing: newCommission.framingOption || 'Without Frame',
          brief: newCommission.brief || '',
          status: ORDER_STATUS.PENDING_REVIEW,
          date: newCommission.date,
          estimatedDelivery: null,
          progress: 0
        });
        localStorage.setItem(CONFIG.STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      } catch (e) {}

      return {
        success: true,
        trackingCode,
        commission: newCommission,
        message: 'YOUR REQUEST HAS BEEN SENT TO THE STUDIO FOR REVIEW.'
      };
    },

    /**
     * Tracking Code Lookup — CUSTOMER-FACING.
     * Only returns fields that are safe to show a stranger with the code:
     * status, tier, price (once confirmed by the studio), and delivery estimate.
     * Never returns the full order list, email, or brief.
     */
    async getCommissionByCode(code) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/commissions/${code}`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}

      let queue = [];
      try {
        queue = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.QUEUE) || JSON.stringify(INITIAL_QUEUE));
      } catch (e) {}

      const match = queue.find(c => c.id.toUpperCase() === code.trim().toUpperCase());
      if (!match) return null;

      return {
        id: match.id,
        tier: match.tier,
        status: match.status,
        price: match.finalPrice ? `₹${match.finalPrice}` : `₹${match.estimatedBudget} (estimate, pending confirmation)`,
        framing: match.framing,
        estimatedDelivery: match.estimatedDelivery || 'To be confirmed by the studio',
        progress: match.progress || 0
      };
    },

    // ========================================================================
    // ADMIN-ONLY — everything below assumes the caller has already passed
    // adminLogin(). None of this should ever be called from customer pages.
    // ========================================================================

    ORDER_STATUS,

    /**
     * Demo-only client-side password gate. Swap for a real Spring Security
     * login (/api/v1/admin/login issuing a session/JWT) before going live.
     */
    adminLogin(password) {
      const ok = password === CONFIG.ADMIN_PASSWORD;
      if (ok) {
        try { sessionStorage.setItem(CONFIG.STORAGE_KEYS.ADMIN_SESSION, 'active'); } catch (e) {}
      }
      return ok;
    },

    isAdminAuthed() {
      try { return sessionStorage.getItem(CONFIG.STORAGE_KEYS.ADMIN_SESSION) === 'active'; } catch (e) { return false; }
    },

    adminLogout() {
      try { sessionStorage.removeItem(CONFIG.STORAGE_KEYS.ADMIN_SESSION); } catch (e) {}
    },

    /**
     * Full order list with every field — admin dashboard only.
     */
    async getAllOrders() {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/commissions`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}

      try {
        return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.QUEUE) || JSON.stringify(INITIAL_QUEUE));
      } catch (e) {
        return INITIAL_QUEUE;
      }
    },

    /**
     * Accept / reject / progress an order, and set (or correct) the final price.
     * patch: { status, finalPrice, estimatedDelivery, progress }
     */
    async updateOrder(id, patch) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/commissions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch)
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}

      let queue = [];
      try {
        queue = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.QUEUE) || JSON.stringify(INITIAL_QUEUE));
      } catch (e) {}

      const idx = queue.findIndex(o => o.id === id);
      if (idx === -1) return null;

      queue[idx] = { ...queue[idx], ...patch };

      // Sensible auto-progress defaults so Netra doesn't have to set every field by hand.
      if (patch.status === ORDER_STATUS.ACCEPTED && queue[idx].progress < 10) queue[idx].progress = 10;
      if (patch.status === ORDER_STATUS.ACCEPTED && !queue[idx].estimatedDelivery) {
        queue[idx].estimatedDelivery = calculateEstimatedDelivery(queue[idx].rushDelivery ? 5 : 9);
      }
      if (patch.status === ORDER_STATUS.IN_PROGRESS && queue[idx].progress < 25) queue[idx].progress = 25;
      if (patch.status === ORDER_STATUS.COMPLETED) queue[idx].progress = 100;
      if (patch.status === ORDER_STATUS.REJECTED) queue[idx].progress = 0;

      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      } catch (e) {}

      return queue[idx];
    },

    /**
     * Called once per page load on the public site to log a visit.
     */
    async recordVisit() {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/analytics/visit`, { method: 'POST' });
        if (response.ok) return;
      } catch (e) {}

      try {
        const today = new Date().toISOString().split('T')[0];
        const data = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.VISITS) || '{"total":0,"byDay":{}}');
        data.total = (data.total || 0) + 1;
        data.byDay = data.byDay || {};
        data.byDay[today] = (data.byDay[today] || 0) + 1;
        localStorage.setItem(CONFIG.STORAGE_KEYS.VISITS, JSON.stringify(data));
      } catch (e) {}
    },

    /**
     * Visitor / reach stats for the admin dashboard.
     */
    async getVisitorStats() {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/admin/analytics`);
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {}

      let data = { total: 0, byDay: {} };
      try {
        data = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.VISITS) || '{"total":0,"byDay":{}}');
      } catch (e) {}

      const today = new Date().toISOString().split('T')[0];
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        last7.push({ date: key, count: (data.byDay && data.byDay[key]) || 0 });
      }

      return {
        totalVisits: data.total || 0,
        todayVisits: (data.byDay && data.byDay[today]) || 0,
        last7Days: last7
      };
    }
  };

  function calculateEstimatedDelivery(daysFromNow) {
    const target = new Date();
    target.setDate(target.getDate() + daysFromNow);
    return target.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
  }

  window.EyeShadesAPI = EyeShadesAPI;
  window.MangaAPI = EyeShadesAPI;

})(window);