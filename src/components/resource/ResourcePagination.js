import { useState } from "react";
import { Pagination } from "react-bootstrap";

function ResourcePagination(props) {
    const [ content, setContent ] = useState({
        currentPage: 1,
    });

    const canLoadMore = props.finished === false;
    const perPage = props.perPage;
    const total = props.total;

    const generatePages = () => {
        let pages = total / perPage;
        let extra = total <= perPage ? 0 : total % perPage;
        let numbers = [];
        for (let index = 1; index < (pages + ((extra > 0 || canLoadMore) ? 1 : 0)); index++) {
            numbers.push(index);
        }
        return numbers;
    };

    const pages = generatePages();

    const jumpToPage = currentPage => {
        return event => {
            if (currentPage >= 1 && currentPage <= pages.length) {
                setContent({
                    currentPage
                });
                props.onSelectedSlice((currentPage - 1) * perPage, Math.min(currentPage * perPage, total));
            }
        };
    };

    return (
        <Pagination className="justify-content-center">
            {pages.length >= 1 &&  <Pagination.First onClick={jumpToPage(1)}/>}
            {pages.length > 1 && <Pagination.Prev onClick={jumpToPage(content.currentPage - 1)}/>}
            {generatePages().map(page => {
                return <Pagination.Item
                    onClick={jumpToPage(page)}
                    active={content.currentPage === page}
                    key={`page-${page}`}>{page}</Pagination.Item>
            })}
            {canLoadMore && <Pagination.Ellipsis onClick={props.onLoadMore}/>}
            {(pages.length > 1 && !canLoadMore) && <Pagination.Next onClick={jumpToPage(content.currentPage + 1)}/>}
            {(pages.length >= 1 && !canLoadMore) && <Pagination.Last onClick={jumpToPage(pages[pages.length - 1])}/>}
        </Pagination>
    );
}

export default ResourcePagination;