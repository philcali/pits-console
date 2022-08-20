import { useEffect, useState } from "react";
import { Spinner } from "react-bootstrap";
import { pitsService } from "../../lib/services";
import { useAlerts } from "../notifications/AlertContext";

function MotionVideo(props) {
    const alerts = useAlerts();
    const [ content, setContent ] = useState({
        loading: true
    })

    useEffect(() => {
        let isMounted = true;
        if (content.loading) {
            pitsService.getVideoUrl(props.thingName, props.motionVideo)
                .then(resp => {
                    if (isMounted) {
                        setContent({
                            loading: false,
                            videoUrl: resp.url
                        });
                    }
                })
                .catch(e => {
                    alerts.error(`Failed to load video: ${e.message}`);
                    setContent({
                        loading: false,
                        message: <p className="text-red">Failed to load {props.motionVideo}.</p>
                    });
                });
        }
    });

    return (
        <>
            {content.loading && <Spinner animation="border"/>}
            {content.videoUrl &&
                <video controls width="100%">
                    <source src={content.videoUrl} type="video/mp4"/>
                    <p>
                        Your browser doesn't support HTML video.
                        Here is <a href={content.videoUrl}>{props.motionVideo}</a> instead.
                    </p>
                </video>
            }
        </>
    )
}

export default MotionVideo;