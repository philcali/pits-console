import React from "react"

function Header({ children, as }) {
    return (
        React.createElement(
            as || 'h2',
            {
                className: "mt-1 pb-2 mb-3",
                style: { borderBottom: '1px solid #dddd' }
            },
            children
        )
    );
}

export default Header;