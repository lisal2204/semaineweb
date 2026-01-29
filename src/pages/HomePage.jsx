import { useEffect, useState } from "react";

export default function HomePage() {
    const [persos, setPersos] = useState([]);

    useEffect(() => {fetchPersos(setPersos, persos)}, []);
/*
    return (
        <>
            <input onKeyUp={event => handlePostTweet(event, getAccessTokenSilently, setTweets)}></input>
            <ul>
                {tweets.map(tweet => <li key={tweet.id}>
                    <div>{tweet.authorName}</div>
                    <div>{tweet.content}</div>
                </li>)}
            </ul>
        </>
    )*/
}

async function fetchPersos(setPersos, persos){
    const response = await fetch("https://rickandmortyapi.com/api/character");
    const body = await response.json();
    setPersos(body);
    console.log(persos);
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