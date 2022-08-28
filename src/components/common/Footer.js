import { Container } from 'react-bootstrap';
import settings from '../../lib/settings.json';

function Footer() {
    return (
        <Container>
            <hr/>
            <footer className="container">
                <p>
                    <span dangerouslySetInnerHTML={{ "__html": "&copy" }}/>{' '}
                    {settings.companyName || 'Calico.'} {new Date().getFullYear()}
                </p>
            </footer>
        </Container>
    );
}

export default Footer;