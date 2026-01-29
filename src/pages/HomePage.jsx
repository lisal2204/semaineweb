import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function HomePage() {
    const [tweets, setTweets] = useState([]);
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        fetchHomeBeeps(getAccessTokenSilently, setTweets);
    }, [getAccessTokenSilently]);

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
    )
}

async function fetchHomeBeeps(getAccessTokenSilently, setTweets){
    const accessToken = await getAccessTokenSilently();
    const response = await fetch("https://beeper-api-2.webdepinfo.fr/home", {
        headers : {
            authorization : `Bearer ${accessToken}`
        }
    });
    const body = await response.json();
    setTweets(body);
}

async function handlePostTweet(event, getAccessTokenSilently, setTweets) {
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


