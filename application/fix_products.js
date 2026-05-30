const fs = require('fs');
const path = require('path');

const filePath = './app/products.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add setSortType to imports
content = content.replace(
  'setPage,\n  useAppDispatch,\n  useAppSelector,\n} from "@/src/store";',
  'setPage,\n  setSortType,\n  useAppDispatch,\n  useAppSelector,\n} from "@/src/store";'
);

// 2. Fix handleSortBy function
content = content.replace(
  /const handleSortBy = useCallback\(\n    \(sortTypeVal: string, label: string\) => \{\n      setSortLabel\(label\);\n      setSortOpen\(false\);\n      \/\/ Dispatch sort action via Redux\n      handleFetchProducts\(1\); \/\/ Reset to page 1 on sort\n    \},\n    \[handleFetchProducts\],\n  \);/,
  `const handleSortBy = useCallback(
    (sortTypeVal: string, label: string) => {
      setSortLabel(label);
      setSortOpen(false);
      dispatch(setSortType(sortTypeVal));
      dispatch(setPage(1));
    },
    [dispatch],
  );`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed products.tsx');
