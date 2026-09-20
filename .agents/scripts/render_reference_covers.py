from pathlib import Path

import fitz


source_dir = Path("attached_assets")
output_dir = Path(".agents/outputs/reference-covers")
output_dir.mkdir(parents=True, exist_ok=True)

for pdf_path in sorted(source_dir.glob("*.pdf")):
    document = fitz.open(pdf_path)
    if not document.page_count:
        continue
    page = document[0]
    pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
    pixmap.save(output_dir / f"{pdf_path.stem}.png")
    print(f"{pdf_path.name}: {document.page_count} pages")