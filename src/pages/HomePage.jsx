import { useEffect, useState, useRef } from "react";
import './HomePage.css';

function CharacterCard({ perso }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`perso-card ${isLoaded ? 'visible' : 'hidden'}`}>
      <div className="img-container">
        <img 
          src={perso.image} 
          alt={perso.name} 
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />
        {isLoaded && (
          <span className={`status-badge ${perso.status.toLowerCase()}`}>
            {perso.status}
          </span>
        )}
      </div>
      
      {isLoaded && (
        <div className="perso-content">
          <h3>{perso.name}</h3>
          <p><span>Espèce:</span> {perso.species}</p>
          <p><span>Position:</span> {perso.location.name}</p>
        </div>
      )}
      
      {!isLoaded && <div className="card-skeleton">🌀</div>}
    </div>
  );
}

// --- COMPOSANT PRINCIPAL ---
export default function HomePage() {
  const [allPersos, setAllPersos] = useState([]);
  const [displayedPersos, setDisplayedPersos] = useState([]); 
  const [bufferPersos, setBufferPersos] = useState([]);
  const [preloadedBatches, setPreloadedBatches] = useState(new Set());
  const [isPreloading, setIsPreloading] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  
  const loaderRef = useRef(null);

  // Fonction pour précharger un batch d'images
  const preloadImages = async (characters) => {
    const promises = characters.map(perso => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = perso.image;
      });
    });
    await Promise.all(promises);
  };

  // Chargement initial et accumulation en arrière-plan
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("https://rickandmortyapi.com/api/character?page=1");
        const data = await res.json();
        
        // Précharger la première page
        await preloadImages(data.results);
        setAllPersos(data.results);
        setDisplayedPersos(data.results);
        setBufferPersos(data.results);
        setPreloadedBatches(new Set([0]));
        
        // Charger les autres pages en arrière-plan
        let accumulatedData = [...data.results];
        for (let i = 2; i <= data.info.pages; i++) {
          const resNext = await fetch(`https://rickandmortyapi.com/api/character?page=${i}`);
          if (!resNext.ok) continue;
          const dataNext = await resNext.json();
          accumulatedData = [...accumulatedData, ...dataNext.results];
          
          // Mettre à jour le buffer tous les 5 pages ou à la dernière page
          if (i % 5 === 0 || i === data.info.pages) {
            setAllPersos([...accumulatedData]);
            setBufferPersos([...accumulatedData]);
          }
        }
      } catch (err) { 
        console.error(err); 
      }
    };
    fetchData();
  }, []);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    let filtered = [...allPersos];
    
    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(perso => 
        perso.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtre par status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(perso => 
        perso.status.toLowerCase() === selectedStatus.toLowerCase()
      );
    }
    
    // Filtre par espèce
    if (selectedSpecies !== "all") {
      filtered = filtered.filter(perso => 
        perso.species.toLowerCase() === selectedSpecies.toLowerCase()
      );
    }
    
    setBufferPersos(filtered);
    setDisplayedPersos(filtered.slice(0, 20));
    setPreloadedBatches(new Set([0]));
  }, [searchTerm, selectedStatus, selectedSpecies, allPersos]);

  // Observer pour le scroll infini
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isPreloading) {
        revealMore();
      }
    }, { threshold: 0.1 });
    
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [bufferPersos, displayedPersos, isPreloading, preloadedBatches]);

  const revealMore = async () => {
    if (displayedPersos.length >= bufferPersos.length) return;
    
    const currentBatch = Math.floor(displayedPersos.length / 12);
    const nextBatch = currentBatch + 1;
    
    // Si ce batch n'a pas encore été préchargé
    if (!preloadedBatches.has(nextBatch)) {
      setIsPreloading(true);
      
      const start = displayedPersos.length;
      const end = Math.min(start + 12, bufferPersos.length);
      const nextCharacters = bufferPersos.slice(start, end);
      
      // Précharger les images du prochain batch
      await preloadImages(nextCharacters);
      
      // Marquer ce batch comme préchargé
      setPreloadedBatches(prev => new Set([...prev, nextBatch]));
      setIsPreloading(false);
    }
    
    // Afficher le prochain batch (images déjà préchargées)
    setDisplayedPersos(prev => bufferPersos.slice(0, prev.length + 12));
  };

  // Extraire les espèces uniques
  const uniqueSpecies = [...new Set(allPersos.map(p => p.species))].sort();

  return (
    <div className="app-wrapper">
      <header className="hero">
        <h1>RICK <span className="and">&</span> MORTY</h1>
      </header>

      <main className="container">
        {/* Barre de filtres */}
        <div className="filters-bar">
          <input 
            type="text" 
            placeholder="🔍 Rechercher un personnage..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">📊 Tous les statuts</option>
            <option value="alive">✅ Alive</option>
            <option value="dead">❌ Dead</option>
            <option value="unknown">❓ Unknown</option>
          </select>
          
          <select 
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="filter-select"
          >
            <option value="all">🧬 Toutes les espèces</option>
            {uniqueSpecies.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
        </div>

        <div className="results-count">
          {bufferPersos.length} personnage{bufferPersos.length > 1 ? 's' : ''} trouvé{bufferPersos.length > 1 ? 's' : ''}
        </div>

        <div className="perso-grid">
          {displayedPersos.map((perso, index) => (
            <CharacterCard key={`${perso.id}-${index}`} perso={perso} />
          ))}
        </div>

        {displayedPersos.length === 0 && bufferPersos.length === 0 && (
          <div className="no-results">
            <p>Aucun personnage trouvé</p>
          </div>
        )}

        <div className="loading-zone" ref={loaderRef}>
          {displayedPersos.length < bufferPersos.length && (
            <div className="portal-loader"></div>
          )}
        </div>
      </main>
    </div>
  );
}