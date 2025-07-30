# Nexus Weaver Kernel - Makefile
# Build configuration for the C kernel component

CC = gcc
CFLAGS = -Wall -Wextra -Werror -std=c11 -D_GNU_SOURCE -pthread \
         -I./include -I/usr/local/include \
         -O2 -g -fPIC \
         -Wno-format-truncation -Wno-stringop-truncation
LDFLAGS = -L/usr/local/lib -lpthread -lm

# Directories
SRC_DIR = src
INC_DIR = include
BUILD_DIR = build
TEST_DIR = tests
OBJ_DIR = $(BUILD_DIR)/obj

# Source files
SOURCES = $(wildcard $(SRC_DIR)/*.c)
OBJECTS = $(patsubst $(SRC_DIR)/%.c,$(OBJ_DIR)/%.o,$(SOURCES))
HEADERS = $(wildcard $(INC_DIR)/*.h)

# Test files
TEST_SOURCES = $(wildcard $(TEST_DIR)/*.c)
TEST_OBJECTS = $(patsubst $(TEST_DIR)/%.c,$(OBJ_DIR)/test_%.o,$(TEST_SOURCES))

# Targets
TARGET = $(BUILD_DIR)/kernel
TEST_TARGET = $(BUILD_DIR)/kernel_tests

# Default target
.PHONY: all
all: build

# Build target
.PHONY: build
build: $(TARGET)

# Create build directories
$(BUILD_DIR) $(OBJ_DIR):
	@mkdir -p $@

# Build the kernel executable
$(TARGET): $(OBJECTS) | $(BUILD_DIR)
	@echo "Linking kernel..."
	@$(CC) $(OBJECTS) -o $@ $(LDFLAGS)
	@echo "✓ Kernel built: $@"

# Compile source files
$(OBJ_DIR)/%.o: $(SRC_DIR)/%.c $(HEADERS) | $(OBJ_DIR)
	@echo "Compiling $<..."
	@$(CC) $(CFLAGS) -c $< -o $@

# Build tests
.PHONY: test
test: $(TEST_TARGET)
	@echo "Running tests..."
	@./$(TEST_TARGET)
	@echo "✓ All tests passed"

$(TEST_TARGET): $(filter-out $(OBJ_DIR)/main.o,$(OBJECTS)) $(TEST_OBJECTS) | $(BUILD_DIR)
	@echo "Building tests..."
	@$(CC) $^ -o $@ $(LDFLAGS) -lcheck -lsubunit

$(OBJ_DIR)/test_%.o: $(TEST_DIR)/%.c | $(OBJ_DIR)
	@echo "Compiling test $<..."
	@$(CC) $(CFLAGS) -c $< -o $@

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BUILD_DIR)
	@echo "✓ Clean complete"

# Format code
.PHONY: format
format:
	@echo "Formatting code..."
	@clang-format -i $(SRC_DIR)/*.c $(INC_DIR)/*.h $(TEST_DIR)/*.c
	@echo "✓ Code formatted"

# Lint code
.PHONY: lint
lint:
	@echo "Linting code..."
	@cppcheck --enable=all --suppress=missingIncludeSystem \
	          --error-exitcode=1 -I$(INC_DIR) $(SRC_DIR)
	@echo "✓ Lint complete"

# Static analysis
.PHONY: analyze
analyze:
	@echo "Running static analysis..."
	@clang --analyze $(CFLAGS) $(SRC_DIR)/*.c
	@echo "✓ Static analysis complete"

# Generate compilation database for IDEs
.PHONY: compile_commands
compile_commands:
	@echo "Generating compile_commands.json..."
	@bear -- make clean build
	@echo "✓ Compilation database generated"

# Development build with debug symbols
.PHONY: debug
debug: CFLAGS += -DDEBUG -O0 -g3
debug: clean build

# Production build with optimizations
.PHONY: release
release: CFLAGS += -DNDEBUG -O3 -march=native
release: clean build

# Memory leak check
.PHONY: memcheck
memcheck: debug test
	@echo "Running memory leak check..."
	@valgrind --leak-check=full --show-leak-kinds=all \
	          --track-origins=yes --verbose \
	          ./$(TARGET)

# Help
.PHONY: help
help:
	@echo "Nexus Weaver Kernel - Build Targets"
	@echo ""
	@echo "  make build      Build the kernel (default)"
	@echo "  make test       Build and run tests"
	@echo "  make clean      Remove build artifacts"
	@echo "  make format     Format code with clang-format"
	@echo "  make lint       Run static analysis with cppcheck"
	@echo "  make analyze    Run clang static analyzer"
	@echo "  make debug      Build with debug symbols"
	@echo "  make release    Build optimized release"
	@echo "  make memcheck   Run valgrind memory check"
	@echo ""