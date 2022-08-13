
function Footer() {
    return (
        <>
            <hr/>
            <footer className="container">
                <p>
                    <span dangerouslySetInnerHTML={{ "__html": "&copy" }}/>{' '}
                    Calico. {new Date().getFullYear()}
                </p>
            </footer>
        </>
    );
}

export default Footer;