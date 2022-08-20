import settings from '../../lib/settings.json';

function Footer() {
    return (
        <>
            <hr/>
            <footer className="container">
                <p>
                    <span dangerouslySetInnerHTML={{ "__html": "&copy" }}/>{' '}
                    {settings.companyName || 'Calico.'} {new Date().getFullYear()}
                </p>
            </footer>
        </>
    );
}

export default Footer;