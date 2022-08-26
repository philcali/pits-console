
function Header({ children }) {
    return (
        <h2 className="pt-3 pb-2 mb-3" style={{ borderBottom: '1px solid #ddd' }}>
            {children}
        </h2>
    );
}

export default Header;