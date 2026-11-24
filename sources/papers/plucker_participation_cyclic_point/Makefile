BUILD := build
MAIN := main

.PHONY: all clean

all: $(BUILD)/$(MAIN).pdf

$(BUILD)/$(MAIN).pdf: $(MAIN).tex references.bib
	mkdir -p $(BUILD)
	pdflatex -interaction=nonstopmode -halt-on-error -output-directory=$(BUILD) $(MAIN).tex
	bibtex $(BUILD)/$(MAIN)
	pdflatex -interaction=nonstopmode -halt-on-error -output-directory=$(BUILD) $(MAIN).tex
	pdflatex -interaction=nonstopmode -halt-on-error -output-directory=$(BUILD) $(MAIN).tex

clean:
	rm -rf $(BUILD)
