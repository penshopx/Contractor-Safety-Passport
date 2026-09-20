from pathlib import Path
import fitz


REFERENCES = {
    "attached_assets/531305432-Format-Rkk-Pelaksanaan_1789868982771.pdf": ".agents/outputs/rkk-reference",
    "attached_assets/399043719-Lampiran-1-Formulir-CSMS_1789868696893.pdf": ".agents/outputs/csms-reference",
}


for source, output_dir in REFERENCES.items():
    document = fitz.open(source)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    pages = sorted({0, min(1, document.page_count - 1), min(2, document.page_count - 1)})
    for page_index in pages:
        page = document[page_index]
        pixmap = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5), alpha=False)
        pixmap.save(output / f"page-{page_index + 1}.png")
    print(f"{source}: {document.page_count} pages, rendered {len(pages)}")