import { Link } from "react-router-dom"

type CategoryCardProps = {
    title: string,
    subtitle: string,
    image: string,
    link: string
}

function CateogryCard ({
    title,
    subtitle,
    image,
    link
}: CategoryCardProps) {
    return(
        <Link
            to={link}
            className="group relative h-96 overflow-hidden rounded-2xl">
            <img
                src={image}
                alt={title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 p-6 text-white">
                <p className="text-sm text-gray-200">
                    {subtitle}
                </p>

                <h3 className="mt-1 text-3xl font-bold">
                    {title}
                </h3>

                <p className="mt-3 text-sm font-semibold">
                    Ver productos 
                </p>
            </div>
        </Link>
    )
}

export default CateogryCard