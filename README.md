# POSTPER

Execute HTTP requests directly from `.http` files in Visual Studio Code. A lightweight, text-based alternative to Postman with support for environment variables, request chaining, and file uploads.

## Features

- **Text-based HTTP requests** - Write requests in simple `.http` files
- **Request chaining** - Use responses from previous requests
- **Environment variables** - Switch between dev/prod/test environments
- **File uploads** - Support for multipart/form-data
- **Syntax highlighting** - Beautiful HTTP syntax coloring
- **Version control friendly** - Plain text files work with Git
- **Fast and lightweight** - No heavy GUI, just your editor

## Installation

Search for "POSTPER" in the Extensions view (`Ctrl+Shift+X`).

If you're cloning the repo and want to test it (the extension isn't available in the VSCode marketplace :()):
1. Run 'git clone https://github.com/munamadan/postper.git'
2. Then run 'npm install' which will install all the packages.
3. Run 'npm compile' to compile the whole extension.
4. Press `Ctrl + F5` to open a new VSCode window with the extension loaded.
5. Open or create a `.http` file and start writing requests! (test .http files are already inside the directory).
6. If you also want to test HTTP requests with environment variables, create a `.env` file in the root directory and add your variables there. More steps are in the examples/02-environment-variables.http file.

## Examples

Check out the `examples/` folder in the GitHub repository for more examples:

- REST API CRUD operations
- Authentication flows
- File uploads
- WebSocket connections (coming soon)

## Known Limitations

- Headers with hyphens in chain variables (use simple names)
- Binary file downloads (text responses only)
- WebSocket support (planned for v2.0)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built using TypeScript and VS Code Extension API

## Support

- **Report bugs:** [GitHub Issues](https://github.com/munamadan/postper/issues)
- **Discussions:** [GitHub Discussions](https://github.com/dipankharel/postper/discussions)
- **Star on GitHub:** [github.com/dipankharel/postper](https://github.com/munamadan/postper)

---

**Made by Dipan Kharel**

---
