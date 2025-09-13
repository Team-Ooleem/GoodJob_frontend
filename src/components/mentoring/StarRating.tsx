import { StarFilledIcon, StarIcon } from '@radix-ui/react-icons';

type Props = {
    rating?: number;
    outOf?: number;
    size?: number;
    className?: string;
};

export function StarRating({ rating = 0, outOf = 5, size = 16, className = '' }: Props) {
    const rounded = Math.round(rating);
    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {Array.from({ length: outOf }).map((_, i) =>
                i < rounded ? (
                    <StarFilledIcon
                        key={i}
                        width={size}
                        height={size}
                        className='text-yellow-500'
                    />
                ) : (
                    <StarIcon
                        key={i}
                        width={size}
                        height={size}
                        className='text-muted-foreground'
                    />
                ),
            )}
        </div>
    );
}
