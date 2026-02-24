import { useEffect, useState, useRef } from "react";
import './HomePage.css';
import { Heart } from 'lucide-react';

const buttonStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '5px',
  marginTop: '10px',
  display: 'block'
};

function CharacterCard({ perso, isFavorite, onToggleFavorite,onHover,onLeave}) {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className={`perso-card ${isLoaded ? 'visible' : 'hidden'}`}
      onMouseMove={(e)=>onHover(e,perso)}
      onMouseLeave={onLeave}
    >
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
          <h3><br></br>{perso.name}</h3>
          <p><span>Espèce:</span> {perso.species}</p>
          <p><span>Localisation:</span> {perso.location.name}</p>
          <p><br></br></p>
          {/* Bouton Favori */}
          <button 
            onClick={() => onToggleFavorite(perso.id)}
            style={buttonStyle}
          >
          <Heart 
            size={28} 
            fill={isFavorite ? "#ff0000" : "none"} 
            color={isFavorite ? "#ff0000" : "#ffffff"} 
          />
          </button>
        </div>
      )}
      
      {!isLoaded && <div className="card-skeleton"></div>}
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
  const [favorites, setFavorites] = useState([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSpecies, setSelectedSpecies] = useState("all");
  
  //pour le popup qui donne plus d'infos
  const [hoverData, setHoverData] = useState({ 
    visible: false, 
    x: 0, 
    y: 0, 
    perso: null 
  });
  
  //pour suivre la souris avec le popup
  const handleMouseMove = (e, perso) => {
    setHoverData({
        visible: true,
        x: e.clientX + 15,
        y: e.clientY + 15,
        perso: perso
    });
  };

  const handleMouseLeave=()=>{
    setHoverData({
        visible:false,
        x:0,
        y:0,
        perso:null
    })
  }
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
    //filtre par favoris
    if (showOnlyFavorites){
        filtered=filtered.filter(perso=>favorites.includes(perso.id));
    }

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
  }, [searchTerm, selectedStatus, selectedSpecies, allPersos,showOnlyFavorites, favorites]);

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

  const toggleFavorite = (id) => {
    setFavorites(prev => 
        prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]
    );
  };
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
            placeholder="Rechercher un personnage"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les status</option>
            <option value="alive">Alive</option>
            <option value="dead">Dead</option>
            <option value="unknown">Unknown</option>

          </select>
          
          <select 
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="filter-select"
          >
            <option value="all">Toutes les espèces</option>
            {uniqueSpecies.map(species => (
              <option key={species} value={species}>{species}</option>
            ))}
          </select>
        </div>

        <div className="fav-toggle-container">
        <button 
            className={`fav-toggle-btn ${showOnlyFavorites ? '' : ''}`}
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
        >
            {showOnlyFavorites ? "Afficher tous les personnages" : "Voir mes favoris"}
        </button>
        </div>

        <div className="results-count">
          {bufferPersos.length} personnage{bufferPersos.length > 1 ? 's' : ''} trouvé{bufferPersos.length > 1 ? 's' : ''}
        </div>

        <div className="perso-grid">
          {displayedPersos.map((perso, index) => (
            <CharacterCard 
              key={`${perso.id}-${index}`} 
              perso={perso} 
              isFavorite={favorites.includes(perso.id)} 
              onToggleFavorite={toggleFavorite}
              onHover={handleMouseMove}
              onLeave={handleMouseLeave}
            />
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
      {hoverData.visible && hoverData.perso && (
        <div 
          className="mouse-popup"
          style={{ 
            top: hoverData.y, 
            left: hoverData.x,
            position: 'fixed'
          }}
        >
          <h4>Infos Complètes</h4>
          <p><strong>Nom : </strong>{hoverData.perso.name}</p>
          <p><strong>Status : </strong>{hoverData.perso.status}</p>
          <p><strong>Espèce : </strong>{hoverData.perso.species}</p>
          <p><strong>Genre : </strong>{hoverData.perso.gender}</p>
          <p><strong>Origine : </strong> {hoverData.perso.origin.name}</p>
          <p><strong>Localisation : </strong>{hoverData.perso.location.name}</p>
          <p><strong>Épisodes:</strong> {hoverData.perso.episode.map(url => url.split('/').pop()).join(', ')}</p>
        </div>
      )}
    </div>
  );
}