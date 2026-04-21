function fixPrepositionsOnPage() {
    const prepositions = ['в', 'во', 'без', 'до', 'для', 'за', 'из', 'к', 'ко', 'на', 'над', 'о', 'об', 'от', 'по', 'под', 'при', 'про', 'с', 'со', 'у', 'через'];
    const regex = new RegExp(`\\s+(${prepositions.join('|')})\\s+`, 'gi');

    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                if (node.parentElement.tagName === 'SCRIPT' ||
                    node.parentElement.tagName === 'STYLE' ||
                    !node.textContent.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodesToReplace = [];
    while (walker.nextNode()) {
        nodesToReplace.push(walker.currentNode);
    }

    nodesToReplace.forEach(node => {
        const newText = node.textContent.replace(regex, (match, prep) => {
            return ` ${prep}\u00A0`;
        });
        if (newText !== node.textContent) {
            node.textContent = newText;
        }
    });
}

document.addEventListener('DOMContentLoaded', fixPrepositionsOnPage);
