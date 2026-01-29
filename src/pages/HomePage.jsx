import { useEffect, useState } from "react";
import './HomePage.css'

export default function HomePage() {
    const [persos, setPersos] = useState([]);

    console.log(persos);

    useEffect(() => {fetchPersos(setPersos)}, []);
    return (
    <div className="container">
        <h1>Rick & Morty Characters</h1>
        
        <div className="perso-grid">
        {persos.map(perso => (
            <div key={perso.id} className="perso-card">
            
            <img src={perso.image} alt={perso.name} className="perso-img" />
            
            <div className="perso-info">
                <h2>{perso.name}</h2>
                
                <ul className="details-list">
                <li><strong>Espèce :</strong> {perso.species}</li>
                <li><strong>Genre :</strong> {perso.gender}</li>
                <li><strong>Origine :</strong> {perso.origin.name}</li>
                </ul>
            </div>

            </div>
        ))}
        </div>
    </div>
    );
}

async function fetchPersos(setPersos){
    const response = await fetch("https://rickandmortyapi.com/api/character");
    const body = await response.json();
    setPersos(body.results);
}
/*
async function handlePostTweet(event, setTweets) {
    if (event.code !== "Enter") {
        return;
    }

    const content = event.target.value;
    const accessToken = await getAccessTokenSilently();

    await fetch("https://beeper-api-2.webdepinfo.fr/beep", {
        method: "POST",
        headers: {
            authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            content: content
        })
    });

    event.target.value = "";
    fetchHomeBeeps(getAccessTokenSilently, setTweets);
}


*/